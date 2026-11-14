import { generateId } from '../utils/ids.js';

export function applyIdPlugin(schema, prefix = 'doc') {
  schema.add({
    _id: {
      type: String,
      default: () => generateId(prefix)
    }
  });

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  });

  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  });
}
