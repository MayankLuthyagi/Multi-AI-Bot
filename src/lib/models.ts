import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// AI Platform Schema
const AIPlatformSchema = new mongoose.Schema({
    name: { type: String, required: true },
    apiKey: { type: String, required: true },
    endpoint: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
UserSchema.pre('save', function () {
    this.updatedAt = new Date();
});

AIPlatformSchema.pre('save', function () {
    this.updatedAt = new Date();
});

// Create indexes
UserSchema.index({ email: 1 });
AIPlatformSchema.index({ userId: 1 });
AIPlatformSchema.index({ name: 1, userId: 1 }, { unique: true });

// Export models
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const AIPlatform = mongoose.models.AIPlatform || mongoose.model('AIPlatform', AIPlatformSchema);

// TypeScript interfaces
export interface IUser {
    _id: string;
    email: string;
    name: string;
    image?: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAIPlatform {
    _id: string;
    name: string;
    apiKey: string;
    endpoint: string;
    isActive: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}