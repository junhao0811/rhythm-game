/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { from, fromEvent, interval, merge, Observable } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";

/** Constants */

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
} as const;

const Constants = {
    TICK_RATE_MS: 500,
    SONG_NAME: "RockinRobin",
} as const;

const Note = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
};

/** User input */

type Key = "KeyH" | "KeyJ" | "KeyK" | "KeyL";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

/** State processing */

type State = Readonly<{
    gameEnd: boolean;
    notes: ReadonlyArray<MusicalNote>;
    score: number;
    missedNotes?: number;
}>;

type MusicalNote = Readonly<{
    user_played: string;
    instrument_name: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
    x: number;
    y: number;
    color: string;
    svgElement?: SVGElement;
}>;

const initialState: State = {
    gameEnd: false,
    notes: [],
    score: 0,
} as const;

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */
const tick = (s: State) => s;

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {},
) => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};

// My functions
/**
 * Parses the notes from the contents of the song CSV file.
 * @param text Contents of the song CSV file
 * @returns Notes parsed from the contents
 */
const parseNotes = (text: string): ReadonlyArray<MusicalNote> => {
    const notes = text
        .split("\n")
        .slice(1)
        .filter((line) => line.trim() !== "")
        .map((note) => {
            const [user_played, instrument_name, velocity, pitch, start, end] =
                note.split(",");
            return {
                user_played,
                instrument_name,
                velocity: parseInt(velocity),
                pitch: parseInt(pitch),
                start: parseFloat(start),
                end: parseFloat(end),
                x: 0,
                y: 0,
                color: "",
            } as MusicalNote;
        });

    return notes;
};

/**
 * Pure transformation of State to make the notes move down the screen.
 * @param s Current state
 * @param yAmount Amount to move down
 * @returns Updated state
 */
function move(note: MusicalNote, yAmount: number): MusicalNote {
    return {
        ...note, // Copies the members of the note for all except:
        y: note.y + yAmount, // Moves the note down
    };
}

/**
 * Associates each note with its corresponding SVG element.
 * @param notes Notes to associate with SVG elements
 * @param svg A canvas element
 * @returns Observable of notes with SVG elements
 */
function associateWithSvgElements(
    notes: ReadonlyArray<MusicalNote>,
    svg: SVGGraphicsElement,
): Observable<MusicalNote> {
    const noteWithSvgElement$ = from(notes).pipe(
        map((note) => {
            // Associate each note with its corresponding SVG element
            return {
                ...note, // Copies the members of the note for all except:
                svgElement: createSvgElement(svg.namespaceURI, "circle", {
                    r: `${Note.RADIUS}`,
                    cx: `${note.x}`,
                    cy: `${note.y}`,
                    style: `fill: ${note.color}`,
                    class: "shadow",
                }) as SVGElement,
            };
        }),
    );

    return noteWithSvgElement$;
}

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main(
    csvContents: string,
    samples: { [key: string]: Tone.Sampler },
) {
    // Canvas elements
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;
    const preview = document.querySelector(
        "#svgPreview",
    ) as SVGGraphicsElement & HTMLElement;
    const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
        HTMLElement;
    const container = document.querySelector("#main") as HTMLElement;

    svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

    // Text fields
    const multiplier = document.querySelector("#multiplierText") as HTMLElement;
    const scoreText = document.querySelector("#scoreText") as HTMLElement;
    const highScoreText = document.querySelector(
        "#highScoreText",
    ) as HTMLElement;

    /** User input */

    const key$ = fromEvent<KeyboardEvent>(document, "keypress");

    const fromKey = (keyCode: Key) =>
        key$.pipe(filter(({ code }) => code === keyCode));

    /** Determines the rate of time steps */
    const tick$ = interval(Constants.TICK_RATE_MS);

    /**
     * Renders the current state to the canvas.
     *
     * In MVC terms, this updates the View using the Model.
     *
     * @param s Current state
     */
    const render = (s: State) => {
        // Add blocks to the main grid canvas
        const greenCircle = createSvgElement(svg.namespaceURI, "circle", {
            r: `${Note.RADIUS}`,
            cx: "20%",
            cy: "200",
            style: "fill: green",
            class: "shadow",
        });

        const redCircle = createSvgElement(svg.namespaceURI, "circle", {
            r: `${Note.RADIUS}`,
            cx: "40%",
            cy: "50",
            style: "fill: red",
            class: "shadow",
        });

        const blueCircle = createSvgElement(svg.namespaceURI, "circle", {
            r: `${Note.RADIUS}`,
            cx: "60%",
            cy: "50",
            style: "fill: blue",
            class: "shadow",
        });

        const yellowCircle = createSvgElement(svg.namespaceURI, "circle", {
            r: `${Note.RADIUS}`,
            cx: "80%",
            cy: "50",
            style: "fill: yellow",
            class: "shadow",
        });

        svg.appendChild(greenCircle);
        svg.appendChild(redCircle);
        svg.appendChild(blueCircle);
        svg.appendChild(yellowCircle);
    };

    const source$ = tick$
        .pipe(scan((acc: State) => ({ gameEnd: false }), initialState))
        .subscribe((s: State) => {
            render(s);

            if (s.gameEnd) {
                show(gameover);
            } else {
                hide(gameover);
            }
        });

    // Parse the notes from the contents of the song CSV file
    const notes: ReadonlyArray<MusicalNote> = parseNotes(csvContents);

    // * Add notes moving down the screen (notes where user_played is True)
    const userPlayedNotes = notes.filter((note) => note.user_played === "True");

    // Introduce some way of associating the notes in your state with their corresponding SVG element
    const noteWithSvgElement$ = associateWithSvgElements(userPlayedNotes, svg);

    // TODO Assign each note to a column based on the pitch
    // ? render, destructure and take out each color
    // ? use forEach? to loop through the array of notes and assign each note to a column based on the pitch

    // TODO Time each note to appear appropriately according to the song (refer to week 3 applied exercise 5)

    // TODO Animate the notes to move down continuously without stopping (refer to week 3 applied exercise 2)

    // TODO Make notes disappear when reaching the bottom of the playing area

    // ! Do not store SVG elements in your state (scan) as this is impure. Refer to the Asteroids example and workshops (week 3/4) for suggestions.

    // * Add user input to play notes

    // TODO Add user input to play a note on a column (refer to week 3 applied exercise 4)

    // TODO Play the note if the key press aligns with the note, otherwise play a random note (refer to week 4 applied exercises 1–2 for implementing randomness, and week 4 applied exercise 6 for how to play a note)

    // * Play notes in the background (notes where user_played is False)

    // TODO Play each background note at the correct time according to the song (refer to week 3 applied exercise 5)
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
    // Load in the instruments and then start your game!
    const samples = SampleLibrary.load({
        instruments: [
            "bass-electric",
            "violin",
            "piano",
            "trumpet",
            "saxophone",
            "trombone",
            "flute",
        ], // SampleLibrary.list,
        baseUrl: "samples/",
    });

    const startGame = (contents: string) => {
        document.body.addEventListener(
            "mousedown",
            function () {
                main(contents, samples);
            },
            { once: true },
        );
    };

    const { protocol, hostname, port } = new URL(import.meta.url);
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

    Tone.ToneAudioBuffer.loaded().then(() => {
        for (const instrument in samples) {
            samples[instrument].toDestination();
            samples[instrument].release = 0.5;
        }

        fetch(`${baseUrl}/assets/${Constants.SONG_NAME}.csv`)
            .then((response) => response.text())
            .then((text) => startGame(text))
            .catch((error) =>
                console.error("Error fetching the CSV file:", error),
            );
    });
}
