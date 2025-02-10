import mongoose, {Schema, model} from "mongoose";

interface ILucky {
	[key: string]: string[] | string | undefined;
}

const LuckySchema = new Schema<ILucky>(
	{
		_id: Schema.Types.ObjectId,
	},
	{strict: false}
);

export const Lucky = mongoose.models.Lucky || model<ILucky>("Lucky", LuckySchema, "luckys");
