import moment from "moment";
import { getAssetAndDataObject, World } from "../../rtsdk";
import { updateText } from "../text";
import { leaderboardLength } from "./LeaderboardManager";

export const updateLeaderboard = async ({ leaderboardArray, req }) => {
  // Check whether there is a deployed leaderboard and, if not, don't do anything.
  const uniqueName = `multiplayer_leaderboard_${req.body.assetId}`;
  const world = World.create(req.body.urlSlug, { credentials: req.body });
  try {
    const droppedAssets = await world.fetchDroppedAssetsWithUniqueName({
      isPartial: true,
      uniqueName,
    });

    let leaderboardExists = false;
    if (droppedAssets && droppedAssets.length) leaderboardExists = true;

    let sanitizedArray = [];
    const date = new Date().valueOf();
    for (var i = 0; i < leaderboardLength; i++) {
      // Update players
      let name = "-";
      let kills = "-";
      if (leaderboardArray[i]) {
        const score = leaderboardArray[i].data.kills;
        const id = leaderboardArray[i].id;
        name = leaderboardArray[i].data.name;
        kills = score.toString() || "0";
        sanitizedArray.push({ id, score, name, date });
      }
      if (leaderboardExists)
        updateText({
          req,
          text: name,
          uniqueName: `multiplayer_leaderboard_${req.body.assetId}_playerName_${i}`,
        });
      // Update scores
      if (leaderboardExists)
        updateText({
          req,
          text: kills,
          uniqueName: `multiplayer_leaderboard_${req.body.assetId}_score_${i}`,
        });
    }

    updateHighScores(req, sanitizedArray, leaderboardExists);
  } catch (e) {
    console.error("Error updating leaderboard", e?.data?.errors || e);
  }
};

const updateHighScores = async (req, sanitizedArray, leaderboardExists) => {
  const arcadeAsset = await getAssetAndDataObject(req); // This seems to be creating issues with API
  if (!arcadeAsset) return;
  const { dataObject } = arcadeAsset;
  const { highScores } = dataObject;

  // Don't update high score if the lowest high score is higher than the top current score.
  if (highScores && highScores[2] && sanitizedArray && sanitizedArray[0].score < highScores[2].score) return;

  let newArray = highScores ? sanitizedArray.concat(highScores) : sanitizedArray;
  let sortedArray = newArray.sort((a, b) => {
    return b.score - a.score;
  });

  const objectArray = dedupe(sortedArray);
  const highScoreArray = objectArray.slice(0, 3);
  // If they are the same, no need to update object or text.
  if (highScores === highScoreArray) return;

  for (let i = 0; i < highScoreArray.length; i++) {
    let name = "-";
    let date = "-";
    let scoreString = "-";
    if (highScoreArray[i]) {
      const score = highScoreArray[i].score;
      name = highScoreArray[i].name;
      scoreString = score.toString() || "0";
      date = moment(parseInt(highScoreArray[i].date)).fromNow();
    }

    if (leaderboardExists)
      updateText({
        req,
        text: name,
        uniqueName: `multiplayer_leaderboard_${req.body.assetId}_topPlayerName_${i}`,
      });

    if (leaderboardExists)
      updateText({
        req,
        text: date,
        uniqueName: `multiplayer_leaderboard_${req.body.assetId}_topDate_${i}`,
      });

    if (leaderboardExists)
      updateText({
        req,
        text: scoreString,
        uniqueName: `multiplayer_leaderboard_${req.body.assetId}_topScore_${i}`,
      });
  }

  try {
    arcadeAsset.updateDroppedAssetDataObject({ highScores: highScoreArray });
  } catch (e) {
    console.error("Cannot update dropped asset", e);
  }
};

// Convert to object to dedupe
function dedupe(arr) {
  var rv = {};
  for (var i = 0; i < arr.length; ++i) {
    const item = arr[i];
    if (item) {
      const id = item.id;
      // Remove duplicate player IDs and prevent score of 0 from being in high score array.
      if (!rv[id] && item.score) rv[id] = item;
    }
  }
  const dedupedArray = Object.keys(rv).map((id) => rv[id]);
  return dedupedArray.sort((a, b) => {
    return b.score - a.score;
  });
}
