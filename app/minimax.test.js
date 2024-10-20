import { Chess } from "chess.js";
import { minimax, getRandomMoves, getPiecesOnBoard, evaluateBoard, getRandomSelection } from "./minimax";

describe("Minimax Algorithm Tests", () => {
  let game;

  beforeEach(() => {
    game = new Chess();
  });

  test("minimax evaluates initial position correctly", () => {
    const score = minimax(game, 2, true);
    expect(typeof score).toBe("number");
  });

  test("getPiecesOnBoard returns correct number of pieces", () => {
    const pieces = getPiecesOnBoard(game);
    expect(pieces.length).toBe(32); // 16 pieces per side at the start
  });

  test("getRandomSelection returns correct number of items", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const randomItems = getRandomSelection(items, 3);
    expect(randomItems.length).toBe(3);
  });

  test("evaluateBoard returns a valid score", () => {
    const score = evaluateBoard(game);
    expect(typeof score).toBe("number");
  });

  test("getRandomMoves returns valid moves", () => {
    const moves = game.moves({ verbose: true });
    const randomMoves = getRandomMoves(game, 2, 2, moves);
    expect(randomMoves.length).toBeGreaterThan(0);
  });
});
