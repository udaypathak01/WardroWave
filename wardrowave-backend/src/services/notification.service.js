import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { queueEmail } from './email.service.js';

/**
 * Persists an in-app notification and queues its email in the caller's transaction.
 */
export async function recordUserNotification({
  userId,
  type,
  title,
  body,
  data = {},
  eventKey,
  emailSubject = title,
  emailText = body,
  emailTemplate = 'generic',
  emailContext = {},
  session,
}) {
  const notification = { user: userId, type, title, body, data, ...(eventKey ? { eventKey } : {}) };
  if (eventKey) {
    await Notification.updateOne(
      { eventKey },
      { $setOnInsert: notification },
      { upsert: true, ...(session ? { session } : {}) }
    ).exec();
  } else {
    await Notification.create([notification], { session });
  }
  const user = await User.findById(userId).select('email name').session(session).lean().exec();
  if (user?.email) {
    await queueEmail({
      eventKey,
      to: user.email,
      subject: emailSubject,
      text: emailText,
      template: emailTemplate,
      context: { ...emailContext, name: emailContext.name ?? user.name },
      session,
    });
  }
}

/**
 * Persists in-app notifications for administrator accounts and emails configured recipients.
 */
export async function notifyAdmins({
  eventKey,
  type,
  title,
  body,
  data = {},
  emailSubject = title,
  emailTemplate = 'generic',
  emailContext = {},
  session,
}) {
  let query = User.find({
    role: { $in: ['admin', 'superadmin'] },
    status: 'active',
  }).select('_id email name');
  if (session) query = query.session(session);
  const admins = await query.lean().exec();
  const notifiedEmails = new Set();
  for (const admin of admins) {
    await recordUserNotification({
      userId: admin._id,
      type,
      title,
      body,
      data,
      eventKey: `${eventKey}:user:${admin._id}`,
      emailSubject,
      emailTemplate,
      emailContext: { ...emailContext, name: admin.name },
      session,
    });
    if (admin.email) notifiedEmails.add(admin.email.toLowerCase());
  }

  const configuredAdminEmails = [
    ...env.ADMIN_EMAILS.split(','),
    ...env.SUPERADMIN_EMAILS.split(','),
  ].map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  for (const email of new Set(configuredAdminEmails)) {
    if (notifiedEmails.has(email)) continue;
    await queueEmail({
      eventKey: `${eventKey}:email:${email}`,
      to: email,
      subject: emailSubject,
      text: body,
      template: emailTemplate,
      context: { ...emailContext, name: 'WardroWave team' },
      session,
    });
  }
}
