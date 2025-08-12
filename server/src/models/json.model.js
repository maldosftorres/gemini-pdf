import mongoose from "mongoose";

const jsonSchema = new mongoose.Schema(
  {
    json: mongoose.Schema.Types.Mixed, // lo que venga
    prompt: String
  },
  { collection: "Json" }
);

export const JsonModel = mongoose.model("Json", jsonSchema, "Json");
