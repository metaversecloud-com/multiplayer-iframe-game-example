
import dotenv from "dotenv";
dotenv.config();

const { AssetFactory, DroppedAssetFactory, Topia, UserFactory, WorldFactory, VisitorFactory } = require("@rtsdk/topia/dist/index.cjs");

const config = {
  apiDomain: process.env.INSTANCE_DOMAIN || "https://api.topia.io/",
  // apiKey: process.env.API_KEY,
  apiProtocol: process.env.INSTANCE_PROTOCOL || "https",
  interactiveKey: process.env.INTERACTIVE_KEY,
  interactiveSecret: process.env.INTERACTIVE_SECRET,
};

const myTopiaInstance = new Topia(config);

const Asset = new AssetFactory(myTopiaInstance);
const DroppedAsset = new DroppedAssetFactory(myTopiaInstance);
const User = new UserFactory(myTopiaInstance);
const World = new WorldFactory(myTopiaInstance);
const Visitor = new VisitorFactory(myTopiaInstance)

export { Asset, DroppedAsset, User, World, Visitor };