export { Viewport, Constants, Note };
export type { Key, Event, State, MusicalNote, Circle, Action };

/** Constants */

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    BOTTOM_PLAYING_AREA: 350,
} as const;

const Constants = {
    TICK_RATE_MS: 30,
    SONG_NAME: "RockinRobin",
} as const;

const Note = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
};

/** User input */

/**
 * a string literal type for each key used in game control
 */
type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL";

/**
 * only input events are keydown, keyup, and keypress
 */
type Event = "keydown" | "keyup" | "keypress";

/**
 * Our game has the following view element types
 */
type MusicalNote = Readonly<{
    user_played: string;
    instrument_name: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
}>;

type Circle = Readonly<{
    id: string;
    cx: number;
    cy: number;
    color: string;
    start: number;
    end: number;
}>;

/**
 * State processing
 * i.e. Game state (non-user interactive)
 */
type State = Readonly<{
    time: number;
    noteData: ReadonlyArray<MusicalNote>;
    circles: ReadonlyArray<Circle>;
    exit: ReadonlyArray<Circle>;
    objCount: number;
    gameEnd: boolean;
    score: number;
}>;

/**
 * Actions modify state
 */
interface Action {
    apply(s: State): State;
}
