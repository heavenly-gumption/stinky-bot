import { getPgConnection }  from '../../../utils/db/pg'
import { Clip, ClipDao } from '../clip.dao'
/*
CREATE TABLE Clips (
    id varchar(255), 
    time timestamp,
    name text, 
    url text,
    clipstart integer,
    clipend integer,
    participants varchar(255) []
)
*/

const db = getPgConnection()

function getClip(id: string): Promise<Clip> {
    return db.one('SELECT * FROM Clips WHERE id = $1', [id]);
}

function getClipByName(name: string): Promise<Clip> {
    return db.one('SELECT * FROM Clips WHERE name = $1', [name]);
}

function getAllClips(): Promise<Array<Clip>> {
    return db.any('SELECT * FROM Clips')
}

function deleteClipByName(name: string): Promise<null> {
    return db.none('DELETE FROM Clips WHERE name = $1', [name])
}

function createClip(clip: Clip): Promise<null> {
    return db.none('INSERT INTO Clips (id, time, name, url, clipstart, clipend, participants, duration)' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
        [clip.id, clip.time, clip.name, 
        clip.url, clip.clipstart, clip.clipend, clip.participants, clip.duration])
}

function renameClip(oldName: string, newName: string): Promise<null> {
    return db.none('UPDATE Clips SET name = $1 WHERE name = $2', [newName, oldName])
}

function trimClip(name: string, start: number, end: number): Promise<null> {
    return db.none('UPDATE Clips SET clipstart = $2, clipend = $3 WHERE name = $1',
        [name, start, end])
}

export const ClipPgDao : ClipDao = {
    getClip,
    getClipByName,
    getAllClips,
    deleteClipByName,
    createClip,
    renameClip,
    trimClip
}