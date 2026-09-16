import { Document, Schema, Types, model } from 'mongoose';

export type ConversationType = 'private' | 'group';

export interface IConversation extends Document {
  _id: Types.ObjectId;
  type: ConversationType;
  participants: Types.ObjectId[];
  groupName?: string;
  groupAvatar?: string;
  groupAdmin?: Types.ObjectId;
  lastMessage?: Types.ObjectId;
  hiddenFor: Types.ObjectId[];
  deletedAt: Array<{ userId: Types.ObjectId; at: Date }>;
  clearedAt: Array<{ userId: Types.ObjectId; at: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    groupName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    hiddenFor: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deletedAt: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        at: {
          type: Date,
          required: true,
        },
      },
    ],
    clearedAt: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        at: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Speeds up "find conversations for this user" queries.
conversationSchema.index({ participants: 1 });
conversationSchema.index({ hiddenFor: 1 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
