import { db }  from '../../utils/db'

export interface Clip {
    id: string,
    time: Date,
    name: string,
    url: string,
    clipstart: number,
    clipend: number,
    participants: string[],
}

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

export function getClip(id: string): Promise<Clip> {
    return db.one('SELECT * FROM Clips WHERE id = $1', [id]);
}

export function getClipByName(name: string): Promise<Clip> {
    return db.one('SELECT * FROM Clips WHERE name = $1', [name]);
}

export function getAllClips(): Promise<Array<Clip>> {
    return db.any('SELECT * FROM Clips')
}

export function deleteClipByName(name: string): Promise<null> {
    return db.none('DELETE FROM Clips WHERE name = $1', [name])
}

export function createClip(clip: Clip): Promise<null> {
    return db.none('INSERT INTO Clips (id, time, name, url, clipstart, clipend, participants)' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7)', 
        [clip.id, clip.time, clip.name, 
        clip.url, clip.clipstart, clip.clipend, clip.participants])
}

export function renameClip(oldName: string, newName: string): Promise<null> {
    return db.none('UPDATE Clips SET name = $1 WHERE name = $2', [newName, oldName])
}