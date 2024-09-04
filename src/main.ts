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

import {
    from,
    fromEvent,
    interval,
    Subscription,
    merge,
    zip,
    Observable,
    pipe,
} from "rxjs";
import { map, filter, scan, delay, concatMap } from "rxjs/operators";
import {
    Constants,
    Viewport,
    Note,
    Key,
    Event,
    State,
    MusicalNote,
    Action,
    Circle,
} from "./types";
import { parseNotes, backgroundSound } from "./util";
import {
    Tick,
    initialState,
    reduceState,
    CreateCircle,
    UpdateCsvRow,
} from "./state";

import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";
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

    // Parses the notes from the contents of the song CSV file
    const note$: Observable<MusicalNote> = parseNotes(csvContents);

    /**
     * Display key mapping with live highlighting of the currently depressed key
     */
    function showKeys() {
        function showKey(k: Key) {
            const key = document.getElementById(k);
            // getElement might be null, in this case return without doing anything
            if (!key) return;
            const o = (e: Event) =>
                fromEvent<KeyboardEvent>(document, e).pipe(
                    filter(({ code }) => code === k),
                );
            o("keydown").subscribe((e) => key.classList.add("highlight"));
            o("keyup").subscribe((_) => key.classList.remove("highlight"));
        }
        showKey("KeyH");
        showKey("KeyJ");
        showKey("KeyK");
        showKey("KeyL");
    }

    backgroundSound(note$, samples);
    showKeys();

    /**
     * Renders the current state to the canvas.
     *
     * In MVC terms, this updates the View using the Model.
     *
     * @param s Current state
     */
    const render = (s: State) => {
        // Add blocks to the main grid canvas
        const updatedView = s.circles.map((circle) => {
            const circlesInView = svg.querySelector(circle.id);
            if (circlesInView) {
                // Update the circle's position if it is in view in the svg
                circlesInView.setAttribute("cy", `${circle.cy}`);
            } else {
                // Create a new circle if it is not in view in the svg
                const newCircle = createSvgElement(svg.namespaceURI, "circle", {
                    id: circle.id,
                    r: `${Note.RADIUS}`,
                    cx: `${circle.cx}`,
                    cy: `${circle.cy}`,
                    style: `fill: ${circle.color}`,
                    class: "shadow",
                });

                svg.appendChild(newCircle);
            }
        });

        // Remove the circles if it exits the svg canvas already
        s.exit.forEach((o) => {
            const circle = svg.querySelector(`circle-${o.id}`);
            if (circle) {
                svg.removeChild(circle);
            }
        });

        return updatedView;
    };

    const action$: Observable<Action> = merge(
        tick$.pipe(map(() => new Tick())),
        note$.pipe(map((note) => new UpdateCsvRow(note))),
        note$.pipe(map((note) => new CreateCircle(note))),
    );
    const source$: Observable<State> = action$.pipe(
        scan(reduceState, initialState),
    );
    source$.subscribe((s: State) => {
        render(s);

        if (s.gameEnd) {
            show(gameover);
        } else {
            hide(gameover);
        }
    });
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
