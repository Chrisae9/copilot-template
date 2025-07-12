import mongoose from 'mongoose';

export interface RoomDoc {
    roomCode: string;
    createdAt: Date;
    players: string[];
    status: string;
    gameSettings?: Record<string, any>;
}

const RoomSchema = new mongoose.Schema<RoomDoc>({
    roomCode: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    players: [{ type: String }],
    status: { type: String, default: 'lobby' },
    gameSettings: { type: Object, default: {} },
});

const Room = (mongoose.models.Room as mongoose.Model<RoomDoc>) || mongoose.model<RoomDoc>('Room', RoomSchema);

export default Room;
