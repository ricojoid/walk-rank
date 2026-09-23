import assert from "node:assert/strict";
import { getRevealParticipants, getRevealScenes, revealReducer, type RevealParticipant } from "../src/components/CinematicLeaderboard";

const participants: RevealParticipant[] = Array.from({ length: 12 }, (_, index) => index + 1).map((rank) => ({
  userId: String(rank), name: `Walker ${rank}`, rank, finalScore: 90,
  totalCountedSteps: 10000, goalsMetCount: 1,
}));
const reveal = getRevealParticipants(participants);
assert.deepEqual(reveal.map((person) => person.rank), [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], "Reveal preserves API tie-breaks and limits to top 10");
participants[0].name = "Changed during polling";
assert.equal(reveal[9].name, "Walker 1", "Presentation is a snapshot");
assert.deepEqual(getRevealParticipants([]), []);
const sparseActivity = participants.map((person) => ({ ...person, totalCountedSteps: person.rank === 1 ? 10000 : 0 }));
const sparseScenes = getRevealScenes(sparseActivity);
assert.deepEqual(sparseScenes.filter((scene) => !scene.suspense).map((scene) => scene.winner.rank), [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], "Zero-step participants must not be skipped");
const started = revealReducer({ scene: 0, lastScene: sparseScenes.length, playing: false }, "start");
assert.equal(sparseScenes[started.scene - 1].winner.rank, 10, "Begin reveals rank 10 even when only rank 1 has activity");
assert.deepEqual(getRevealParticipants(participants.slice(0, 2)).map((person) => person.rank), [2, 1]);

const scenes = getRevealScenes(participants);
assert.deepEqual(scenes.map(({ winner, suspense, duration }) => [winner.rank, suspense, duration]), [
  [10, false, 3000], [9, false, 3000], [8, false, 3000], [7, false, 3000],
  [6, false, 3000], [5, false, 3000], [4, false, 3000],
  [3, true, 3000], [3, false, 6000], [2, true, 3000], [2, false, 6000],
  [1, true, 3000], [1, false, 6000],
]);
assert.equal(scenes.reduce((total, scene) => total + scene.duration, 0), 48000);
assert.deepEqual(getRevealScenes([]), []);
assert.deepEqual(getRevealScenes(participants.slice(0, 1)).map((scene) => scene.suspense), [true, false]);

let state = { scene: 0, lastScene: scenes.length, playing: false };
assert.deepEqual(revealReducer(state, "tick"), state, "Paused presentation cannot advance itself");
assert.equal(revealReducer(state, "back").scene, 0);
state = revealReducer(state, "start");
assert.equal(state.scene, 1, "Begin starts the first scene immediately");
assert.equal(state.playing, true, "Begin starts autoplay without a second click");
for (let scene = 2; scene <= scenes.length; scene++) {
  state = revealReducer(state, "tick");
  assert.equal(state.scene, scene);
  assert.equal(state.playing, true, "Each scene, including champion, gets its display duration");
}
assert.equal(scenes[state.scene - 1].winner.rank, 1);
assert.equal(scenes[state.scene - 1].suspense, false);
state = revealReducer(state, "tick");
assert.equal(state.playing, false, "Autoplay stops after champion's six seconds");
assert.equal(state.scene, scenes.length, "Champion stays on screen, with no summary slide");
assert.equal(revealReducer(state, "next").scene, scenes.length, "Cannot advance past champion");
assert.deepEqual(revealReducer(state, "tick"), state, "Stopped champion stays indefinitely");
assert.equal(revealReducer(state, "toggle").playing, false);
state = revealReducer(state, "replay");
assert.equal(state.scene, 0);
assert.equal(state.playing, false, "Replay waits for presenter");
state = revealReducer(revealReducer(state, "toggle"), "next");
assert.equal(state.playing, false, "Manual navigation pauses autoplay");
assert.equal(revealReducer(revealReducer(state, "toggle"), "pause").playing, false);
assert.deepEqual(revealReducer({ scene: 0, lastScene: 0, playing: false }, "start"), { scene: 0, lastScene: 0, playing: false });
console.log("Cinematic checks passed: top 10, 3s/6s timings, podium suspense, instant autoplay, champion hold, replay, empty/partial rankings.");
