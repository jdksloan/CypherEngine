import { RelationshipDirection } from './models/RelationshipDirection';
import { CypherEngine } from './engine/CypherEngine';
import { Property } from './models/Property';

let engine = new CypherEngine();

const create = engine
    .create()
    .node(['Person'], 'jeff', new Property('name', `'Jeff'`))
    .toString();

// CREATE (jeff:Person {name: 'Jeff'})
/* tslint:disable-next-line */
console.log(create);

engine = new CypherEngine();
const match = engine
    .match()
    .node(['Director'], 'director', new Property('name', `'Oliver Stone'`))
    .relates(RelationshipDirection.undirected, [])
    .returns('movie.title')
    .toString();

// MATCH (Director:director {name: 'Oliver Stone'})--(movie)
// RETURN movie.title
/* tslint:disable-next-line */
console.log(match);


engine = new CypherEngine();
const match2 = engine
    .match()
    .node(['Director'], 'director', new Property('name', `'Oliver Stone'`))
    .relates(RelationshipDirection.undirected, [])
    .returns('movie.title')
    .toString();

// MATCH (wallstreet:Movie {title: 'Wall Street'})<-[:ACTED_IN]-(actor)
//RETURN actor.name
/* tslint:disable-next-line */
console.log(match2);

