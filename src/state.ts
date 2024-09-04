// Functions and definitions of game state objects and state management.
// The only exports are the `initialState` object and the function `reduceState`.
export { Tick, CreateCircle, UpdateCsvRow, initialState, reduceState };

// Game state is modelled in one main object of type State, which contains collections of the game elements

import {
    Viewport,
    Constants,
    Note,
    Key,
    Event,
    State,
    Action,
    MusicalNote,
} from "./types";
// import { fromKey, RNG } from "./util";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */

class CreateCircle implements Action {
    constructor(public readonly note: MusicalNote) {}
    /**
     * TODO: Add notes moving down the screen (notes where user_played is True)
     */

    apply = (s: State) => {
        if (this.note.user_played === "True") {
            const newCircle = {
                id: `circle-${s.objCount}`,
                cx: Number(CreateCircle.getCx(this.note.pitch)),
                cy: 0,
                color: CreateCircle.getColor(this.note.pitch),
                start: this.note.start,
                end: this.note.end,
            };
            return {
                ...s,
                circles: [...s.circles, newCircle],
                objCount: s.objCount + 1,
            };
        }
        return s;
    };

    static getCx = (pitch: number): number => {
        const width = Viewport.CANVAS_WIDTH - 40 * 2;
        const spacing = width / (4 - 1);
        return 40 + (pitch % 4) * spacing;
    };

    static getColor = (pitch: number): string => {
        const color = ["green", "red", "blue", "yellow"];
        return color[pitch % 4];
    };
}

class UpdateCsvRow implements Action {
    constructor(public readonly note: MusicalNote) {}
    // Update to the next row of the CSV file
    apply = (s: State) => {
        const updateNote = { ...this.note };
        return {
            ...s,
            noteData: [...s.noteData, updateNote],
        };
    };
}

const initialState: State = {
    time: 0, // Non user interactive state
    noteData: [], // Non user interactive state
    circles: [], // Non user interactive state
    exit: [], // Non user interactive state
    objCount: 0, // Non user interactive state
    gameEnd: false, // Non user interactive state
    score: 0, // Non user interactive state
} as const;

class Tick implements Action {
    /**
     * interval tick: circles move, plays background music, notes disappear
     * @param s old State
     * @returns new State
     *
     * * Add notes moving down the screen (notes where user_played is True)
     * TODO: Time each note to appear appropriately according to the song (refer to week 3 applied exercise 5)
     * TODO: Animate the notes to move down continuously without stopping (refer to week 3 applied exercise 2)
     * TODO: Make notes disappear when reaching the bottom of the playing area
     * ! Do not store SVG elements in your state (scan) as this is impure. Refer to the Asteroids example and workshops (week 3/4) for suggestions.
     *
     * * Play notes in the background (notes where user_played is False)
     * TODO: Play each background note at the correct time according to the song (refer to week 3 applied exercise 5)
     *
     * * The game should end when the song finishes playing
     */
    apply(s: State): State {
        const moveCircle = s.circles.map((circle) => {
            return {
                ...circle,
                cy: circle.cy + 5,
            };
        });
        const activeCircles = moveCircle.filter(
            (circle) => circle.cy < Viewport.BOTTOM_PLAYING_AREA,
        );

        const expiredCircles = s.circles.filter(
            (circle) => circle.cy >= Viewport.BOTTOM_PLAYING_AREA,
        );

        // Play each background note at the correct time according to the song (refer to week 3 applied exercise 5)

        return {
            ...s, // user interactive state
            circles: activeCircles,
            exit: [...s.exit, ...expiredCircles],
        };
    }
}

/**
 * state transducer
 * @param s input State
 * @param action type of action to apply to the State
 * @returns a new State
 */
const reduceState = (s: State, action: Action) => action.apply(s);
