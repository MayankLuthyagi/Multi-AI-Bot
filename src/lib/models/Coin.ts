import { ObjectId } from 'mongodb';

export interface HistoryEntry {
    price: number;
    timestamp: Date;
}

export interface Coin {
    _id?: ObjectId;
    symbol: string; // Uppercase coin symbol (e.g., 'BTCUSDT')
    createdAt: Date;
    history: HistoryEntry[]; // Price history
}

export const CoinCollection = 'coins';
