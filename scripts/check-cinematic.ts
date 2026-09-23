import assert from "node:assert/strict";
import { getRevealParticipants, revealReducer, type RevealParticipant } from "../src/components/CinematicLeaderboard";

const participants: RevealParticipant[] = [1, 2, 3, 4].map((rank) => ({
  userId: String(rank), name: `Walker ${rank}`, rank, finalScore: 90,
  totalCountedSteps: 10000, goalsMetCount: 1,
}));
const reveal = getRevealParticipants(participants);
assert.deepEqual(reveal.map((person) => person.rank), [3, 2, 1], "Reveal preserves API tie-breaks in countdown order");
participants[0].name = "Changed during polling";
assert.equal(reveal[2].name, "Walker 1", "Presentation is a snapshot");
assert.deepEqual(getRevealParticipants([]), []);
assert.deepEqual(getRevealParticipants([{ ...participants[0], totalCountedSteps: 0 }]), []);
assert.deepEqual(getRevealParticipants(participants.slice(0, 2)).map((person) => person.rank), [2, 1]);

let state = { scene: 0, lastScene: reveal.length + 1, playing: false };
assert.deepEqual(revealReducer(state, "tick"), state, "Paused presentation cannot advance itself");
assert.equal(revealReducer(state, "back").scene, 0);
state = revealReducer(state, "toggle");
for (let scene = 1; scene <= 4; scene++) {
  state = revealReducer(state, "tick");
  assert.equal(state.scene, scene);
}
assert.equal(state.playing, false, "Autoplay stops on finale");
assert.equal(revealReducer(state, "next").scene, 4, "Cannot advance past finale");
assert.equal(revealReducer(state, "toggle").playing, false);
state = revealReducer(state, "replay");
assert.equal(state.scene, 0);
assert.equal(state.playing, false, "Replay waits for presenter");
state = revealReducer(revealReducer(state, "toggle"), "next");
assert.equal(state.playing, false, "Manual navigation pauses autoplay");
assert.equal(revealReducer(revealReducer(state, "toggle"), "pause").playing, false);
console.log("Cinematic checks passed: ranking snapshots, partial/empty podium, playback, boundaries, replay.");
