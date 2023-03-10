import { Visitor } from "../rtsdk";
import "regenerator-runtime/runtime";

export const getRoomAndUsername = async (query) => {
  const { isAdmin, username } = await checkWhetherVisitorInWorld(query);
  return { isAdmin, roomName: query[roomBasedOn()], username };
};

export const roomBasedOn = () => {
  // Can be changed to dynamically alter the query being used as basis of room name.
  return "assetId";
};

const checkWhetherVisitorInWorld = async (query) => {
  // Check whether have access to interactive nonce, which means visitor is in world.
  const { assetId, interactivePublicKey, interactiveNonce, urlSlug, visitorId } = query;

  try {
    const visitor = await Visitor.get(visitorId, urlSlug, {
      credentials: {
        assetId,
        interactiveNonce,
        interactivePublicKey,
        visitorId,
      },
    });
    if (!visitor || !visitor.username) throw "Not in world";

    const { privateZoneId, username, isAdmin } = visitor;

    if (!privateZoneId || privateZoneId !== assetId) {
      // Not in the private Zone.  Can watch ships fly around, but can't play.
      return { username: null, isAdmin };
    } else {
      return { isAdmin, username };
    }
  } catch (e) {
    // Not actually in the world.  Should prevent from seeing game.
    console.log("ERROR", e?.data?.errors);
    return { isAdmin: false, username: -1 };
  }
};