export class ApiResponse {
  static success(res, data, meta, statusCode = 200) {
    const responseMeta = meta && meta.pages !== undefined && meta.totalPages === undefined
      ? { ...meta, totalPages: meta.pages }
      : meta;
    const body = {
      success: true,
      data,
    };
    if (responseMeta !== undefined) body.meta = responseMeta;
    return res.status(statusCode).json(body);
  }
}
