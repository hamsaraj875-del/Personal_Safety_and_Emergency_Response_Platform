import mongoose from 'mongoose';
import { applyIdPlugin } from './plugins.js';

const fleetVehicleSchema = new mongoose.Schema(
  {
    vehicleNo: { type: String, required: true, unique: true },
    type: { type: String, default: 'ALS Advanced Life Support' },
    driver: { type: String, required: true },
    status: {
      type: String,
      enum: ['Ready', 'Dispatched', 'On Scene'],
      default: 'Ready'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },
    fuel: { type: String, default: '85%' },
    depot: { type: String, default: 'South Base' },
    isDisplaceCandidate: { type: Boolean, default: false },
    simulated: { type: Boolean, default: true }
  },
  { timestamps: true }
);

fleetVehicleSchema.index({ location: '2dsphere' });
applyIdPlugin(fleetVehicleSchema, 'veh');

export const FleetVehicle = mongoose.model('FleetVehicle', fleetVehicleSchema);
