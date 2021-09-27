# CypherEngine

## Introduction
**Cypher Engine** is a fully tested *Cypher* query engine which generates queries in a functional, easy to read, and simple way. It is designed for NodeJS and written in TypeScript.

## Premise
This documentation **does not** explain how *Cypher* works nor does it try to be a tutorial for *Cypher*. When using this library it is recommended that you have a good understanding of the *Cypher* language. Please see the [Cyper Documentation](https://neo4j.com/docs/cypher-manual/current/) for more information.

## Index
* [Create](#create)
* [Delete](#delete)
* [Match](#match)
* [Set](#set)
* [Merge](#merge)
* [Extra](#extra)


### Create

Creating a node in Cypher is the fundamental way to build data in the graph.

```
const engine = new CypherEngine();

const create = engine
    .create()
    .node(['Person'], 'jeff', new Property('name', `'Jeff'`))
    .toString();

// CREATE (jeff:Person {name: 'Jeff'})
```



### Match

```
const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'u')
      .relates(RelationshipDirection.undirected)
      .node([], 'company')
      .returns('*')
      .toString();

// MATCH (u:User)--(company) RETURN *
```

### Delete

```
const engine = new CypherEngine();
const result = engine
      .match()
      .node(['User'], 'n0', new Property('email', `'test@test.com'`))
      .relates(RelationshipDirection.left, ['works_for'], undefined, undefined, new Property('years', 5))
      .node(['Company'], 'n1', new Property('name', `'test'`))
      .delete('n0', 'n1')
      .returns()
      .toString();

/* MATCH (n0:User{email:'test@test.com'})<-[:works_for{years:5}]-(n1:Company{name:'test'}
DELETE n0,n1
RETURN *
```



### Set
```
const engine = new CypherEngine();
const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .set(new SetProperty('n0', new Property('name', '$name')), new SetProperty('n0', new Property('birthday', '$birthday'))).cypher;

/*`MATCH (n0:Person{identifier:$identifier})
SET n0.name = $name, n0.birthday = $birthday`);
*/

```


### Merge

```
const engine = new CypherEngine();
const result = engine
      .merge()
      .node(['Person'], 'n0', new Property('name', `'Keanu Reeves'`))
      .onCreate()
      .set(new SetProperty('n0', new Property('created', 123)))
      .onMatch()
      .set()
      .variable('n0', 'modified')
      .equals()
      .value(123)
      .returns()
      .toString();

/* MERGE (n0:Person{name:'Keanu Reeves'})
ON CREATE SET n0.created = 123
ON MATCH SET
n0.modified = 123 RETURN *
*/
```


### Extra
For more complex queries, additonal operators etc... please see the extensive tests in *test/CypherEngine.spec.ts*
