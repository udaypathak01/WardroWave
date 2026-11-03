#!/usr/bin/env bash
set -e
MONGO_URI="${MONGODB_URI:-mongodb://mongodb:27017/admin?directConnection=true}"
mongosh "$MONGO_URI" --quiet --eval "try { rs.status(); print('Replica set already initialized'); } catch (error) { rs.initiate({_id: 'rs0', members: [{ _id: 0, host: 'mongodb:27017' }]}); print('Replica set initialized'); }"
