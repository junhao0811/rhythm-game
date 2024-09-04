/** Utility functions */
// Everything is designed to be as reusable as possible in many different contexts.
export { parseNotes, backgroundSound };

import {
    from,
    fromEvent,
    interval,
    Subscription,
    merge,
    zip,
    Observable,
    timer,
    of,
} from "rxjs";
import { map, filter, scan, delay, concatMap, mergeMap } from "rxjs/operators";
import { Note, Circle, MusicalNote, Key, Constants } from "./types";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";

/**
 * Parses the notes from the contents of the song CSV file.
 * @param text Contents of the song CSV file
 * @returns an Observable of notes
 */
const parseNotes = (contents: string): Observable<MusicalNote> => {
    const note$ = from(contents.split("\n").slice(1));
    return from(note$).pipe(
        filter((line) => line.trim() !== ""),
        mergeMap((note) => {
            const [user_played, instrument_name, velocity, pitch, start, end] =
                note.split(",");
            const row: MusicalNote = {
                user_played,
                instrument_name,
                velocity: parseInt(velocity),
                pitch: parseInt(pitch),
                start: parseFloat(start),
                end: parseFloat(end),
            };
            return timer(row.start * 1000).pipe(map(() => row));
        }),
    );
};

const backgroundSound = (
    note: Observable<MusicalNote>,
    samples: { [key: string]: Tone.Sampler },
) => {
    note.pipe(
        mergeMap((note) => {
            if (note.user_played === "False") {
                const instrument = samples[note.instrument_name];
                if (instrument) {
                    return of(note).pipe(
                        delay(note.start),
                        mergeMap(() => {
                            instrument.triggerAttackRelease(
                                Tone.Frequency(note.pitch, "midi").toNote(),
                                note.end - note.start,
                                Tone.now(),
                                note.velocity / 127,
                            );
                            return of(note).pipe(
                                delay((note.end - note.start) * 1000),
                            );
                        }),
                    );
                }
            }
            return of(note);
        }),
    ).subscribe();
};
