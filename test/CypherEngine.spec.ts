import { SetProperty } from '../src/models/SetProperty';
import { Property } from '../src/models/Property';
import { RelationshipDirection } from '../src/models/RelationshipDirection';
import { PathRange } from '../src/models/PathRange';
import { CypherEngine } from './../src/engine/CypherEngine'

describe('Test CypherEngine', () => {

  beforeEach(() => {
  });

  test('GenerateQuery with empty query', () => {
    const engine = new CypherEngine();
    expect(engine.cypher).toBe('');
  });

  test('GenerateQuery with empty query on CallQuery', () => {
    const engine = new CypherEngine();
    engine.callQuery(new CypherEngine());
    expect(engine.cypher).toBe(`CALL {${''}}`);
  });

  test('Match with string property filter', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['User'], 'n0', new Property('email', `'test@test.com'`)).returns().toString();
    expect(result).toBe(`MATCH (n0:User{email:'test@test.com'})\nRETURN *`);
  });

  test('Match with number property filter', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['User'], 'n0', new Property('age', 34)).returns().toString();
    expect(result).toBe(`MATCH (n0:User{age:34})\nRETURN *`);
  });

  test('Match with no filter', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['User', 'Test1'], 'n0').returns().toString();
    expect(result).toBe(`MATCH (n0:User:Test1)\nRETURN *`);
  });

  test('Match with no filter but with limit', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['User', 'Test1'], 'n0').returns().limit(100).toString();
    expect(result).toBe(`MATCH (n0:User:Test1)\nRETURN * LIMIT 100`);
  });

  test('OPTIONAL match with no filter', () => {
    const engine = new CypherEngine();
    const result = engine.optionalMatch().node(['User', 'Test1'], 'n0').returns().toString();
    expect(result).toBe(`OPTIONAL MATCH (n0:User:Test1)\nRETURN *`);
  });

  test('Two MATCH with two property filters', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0', new Property('email', `'test@test.com'`), new Property('identity', 123))
      .match()
      .node(['Company'], 'n1', new Property('name', `'test'`), new Property('identity', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(
      `MATCH (n0:User{email:'test@test.com', identity:123})\nMATCH (n1:Company{name:'test', identity:'test'})\nRETURN *`
    );
  });


  test('MATCH RELATES to NODE with at least 3 nodes in between', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0', new Property('email', `'test@test.com'`))
      .relates(RelationshipDirection.right, ['works_for'], undefined, new PathRange(3, undefined), new Property('years', 5))
      .node(['Company'], 'n1', new Property('name', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(`MATCH (n0:User{email:'test@test.com'})\n-[:works_for*3..{years:5}]->(n1:Company{name:'test'})\nRETURN *`);
  });

  test('MATCH RELATES to NODE WITH all', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0', new Property('email', `'test@test.com'`))
      .relates(RelationshipDirection.right, ['works_for'], undefined, undefined, new Property('years', 5))
      .node(['Company'], 'n1', new Property('name', `'test'`))
      .with('n0', 'n1')
      .returns()
      .toString();
    expect(result).toBe(
      `MATCH (n0:User{email:'test@test.com'})\n-[:works_for{years:5}]->(n1:Company{name:'test'})\nWITH n0,n1\nRETURN *`
    );
  });

  test('MATCH RELATES to NODE Variable undirected', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'u')
      .relates(RelationshipDirection.undirected)
      .node([], 'company')
      .returns('u')
      .toString();
    expect(result).toBe(
      `MATCH (u:User)\n--(company)\nRETURN u`
    );
  });

  test('MATCH RELATES to NODE WITH DELETE both', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0', new Property('email', `'test@test.com'`))
      .relates(RelationshipDirection.left, ['works_for'], undefined, undefined, new Property('years', 5))
      .node(['Company'], 'n1', new Property('name', `'test'`))
      .delete('n0', 'n1')
      .returns()
      .toString();
    expect(result).toBe(
      `MATCH (n0:User{email:'test@test.com'})\n<-[:works_for{years:5}]-(n1:Company{name:'test'})\nDELETE n0,n1\nRETURN *`
    );
  });

  test('MATCH RELATES to NODE WITH DETACH DELETE both', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0', new Property('email', `'test@test.com'`))
      .relates(RelationshipDirection.undirected, ['works_for'], undefined, undefined, new Property('years', 5))
      .node(['Company'], 'n1', new Property('name', `'test'`))
      .detach()
      .delete('n0', 'n1')
      .returns()
      .toString();
    expect(result).toBe(
      `MATCH (n0:User{email:'test@test.com'})\n-[:works_for{years:5}]-(n1:Company{name:'test'})\nDETACH DELETE n0,n1\nRETURN *`
    );
  });

  test('SET with one Property', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .set(new SetProperty('n0', new Property('name', '$name'))).cypher;
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nSET n0.name = $name`);
  });

  test('MATCH WHERE', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['User'], 'n0').where().variable('n0', 'name').equals().value('$name').returns().toString();
    expect(result).toBe(`MATCH (n0:User)\nWHERE n0.name = $name RETURN *`);
  });

  test('MATCH WHERE AND CONTAINS NOT', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0')
      .where()
      .variable('n0', 'name')
      .equals()
      .value('$name')
      .and()
      .not()
      .variable('n0', 'email')
      .contains()
      .value(`'test'`)
      .returns()
      .toString();
    expect(result).toBe(`MATCH (n0:User)\nWHERE n0.name = $name AND NOT n0.email CONTAINS 'test' RETURN *`);
  });

  test('MATCH WHERE OR CONTAINS', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['User'], 'n0')
      .where()
      .variable('n0', 'name')
      .equals()
      .value('$name')
      .or()
      .variable('n0', 'email')
      .contains()
      .value(`'test'`)
      .returns()
      .toString();
    expect(result).toBe(`MATCH (n0:User)\nWHERE n0.name = $name OR n0.email CONTAINS 'test' RETURN *`);
  });

  test('MATCH SET with two Property', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .set(new SetProperty('n0', new Property('name', '$name')), new SetProperty('n0', new Property('birthday', '$birthday'))).cypher;
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nSET n0.name = $name, n0.birthday = $birthday`);
  });

  test('MERGE with one property return it', () => {
    const engine = new CypherEngine();
    const result = engine.merge().node(['Person'], 'n0', new Property('identifier', '$identifier')).returns('n0').toString();
    expect(result).toBe(`MERGE (n0:Person{identifier:$identifier})\nRETURN n0`);
  });

  test('CREATE with one property return it', () => {
    const engine = new CypherEngine();
    const result = engine.create().node(['Person'], 'n0', new Property('identifier', '$identifier')).returns('n0').toString();
    expect(result).toBe(`CREATE (n0:Person{identifier:$identifier})\nRETURN n0`);
  });


  test('MATCH with Label using declaredNode', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').where().declaredNode('n0', 'Natural').returns('n0').toString();
    expect(result).toBe(`MATCH (n0:Person)\nWHERE (n0:Natural)\nRETURN n0`);
  });

  test('MATCH with Label using declaredNode fails', () => {
    const engine = new CypherEngine();
    try {
      const result = engine.match().node(['Person'], 'n0').where().declaredNode('n', 'Natural').returns('n0').toString();
      expect(result).toBe(`MATCH (n0:Person)\nWHERE (n0:Natural)\nRETURN n0`);
    } catch (error) {
      expect(error.message).toBe('Could not find node n');
    }
  });

  test('MATCH WHERE exists', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0', new Property('identifier', '$identifier')).where().exists('n0', 'name').with().returns('n0').toString();
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nWHERE exists(n0.name)\nWITH *\nRETURN n0`);
  });

  test('MATCH WITH Order', () => {
    const engine = new CypherEngine();
    const sort: Array<{ prop: string; asc: boolean }> = [
      { prop: 'name', asc: true },
      { prop: 'age', asc: true }
    ];
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').orderBy(['n0', 'n1'], sort).returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\nORDER BY n0.name  , n0.age  , n1.name  , n1.age\nRETURN *`);
  });

  test('Condtional true', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').conditional(true, `WHERE n0.name = 'Test'`, '').returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\nWHERE n0.name = 'Test' RETURN *`);
  });

  test('Condtional false', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').conditional(false, `WHERE n0.name = 'Test'`, '').returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\n RETURN *`);
  });

  test('CondtionalFunc true', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0')
      .match()
      .node(['Person'], 'n01')
      .conditionalFunc(
        true,
        (e: any) => {
          return e.where().variable('n0', 'name').equals().value(`'Test'`);
        },
        (e: any) => e
      )
      .returns()
      .toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\nWHERE n0.name = 'Test' RETURN *`);
  });

  test('CondtionalFunc false', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0')
      .match()
      .node(['Person'], 'n01')
      .conditionalFunc(
        false,
        (e: any) => {
          return e.where().variable('n0', 'name').equals().value(`'Test'`);
        },
        (e: any) => e
      )
      .returns()
      .toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\nRETURN *`);
  });

  test('MATCH WITH Order', () => {
    const engine = new CypherEngine();
    const sort: Array<{ prop: string; asc: boolean }> = [
      { prop: 'name', asc: true },
      { prop: 'age', asc: true }
    ];
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').orderBy(['n0', 'n1'], sort).returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\nORDER BY n0.name  , n0.age  , n1.name  , n1.age\nRETURN *`);
  });

  test('MATCH WITH Order but no parms', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').orderBy(['n0', 'n1']).returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nMATCH (n01:Person)\nRETURN *`);
  });

  test('MATCH WHERE Starts with', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .where()
      .variable('n0', 'name')
      .startsWith()
      .value(`'1a'`)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nWHERE n0.name STARTS WITH '1a' WITH *\nRETURN n0`);
  });

  test('MATCH WHERE ends with', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .where()
      .variable('n0', 'name')
      .endsWith()
      .value(`'1a'`)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nWHERE n0.name ENDS WITH '1a' WITH *\nRETURN n0`);
  });

  test('MATCH WHERE greater than with', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .where()
      .variable('n0', 'age')
      .greaterThan()
      .value(5)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nWHERE n0.age > 5 WITH *\nRETURN n0`);
  });

  test('MATCH WHERE less than with', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0', new Property('identifier', '$identifier'))
      .where()
      .variable('n0', 'age')
      .lessThan()
      .value(5)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(`MATCH (n0:Person{identifier:$identifier})\nWHERE n0.age < 5 WITH *\nRETURN n0`);
  });

  test('MATCH WHERE regular expression with', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').where().variable('n0', 'name').regularExpression().value(`'Tim.*'`).with().returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nWHERE n0.name =~ 'Tim.*' WITH *\nRETURN *`);
  });

  test('MATCH WHERE IS NOT NULL', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').where().variable('n0').is().not().null().returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nWHERE (n0) IS NOT NULL RETURN *`);
  });

  test('MATCH WHERE IN array', () => {
    const engine = new CypherEngine();
    const result = engine.match().node(['Person'], 'n0').where().variable('n0').in().value([1, 2, 3]).returns().toString();
    expect(result).toBe(`MATCH (n0:Person)\nWHERE (n0) IN [1,2,3] RETURN *`);
  });

  test('CREATE with UNWIND', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Person'], 'n0')
      .unwind()
      .value('{modelItems} as modelItem')
      .merge()
      .variable('n0')
      .relates(RelationshipDirection.left, ['created_by'])
      .node(['ModelItem'], 'mi', new Property('name', 'modelItem.name'))
      .returns()
      .toString();
    expect(result).toBe(
      `MATCH (n0:Person)\nUNWIND {modelItems} as modelItem MERGE (n0) <-[:created_by]-(mi:ModelItem{name:modelItem.name})\nRETURN *`
    );
  });

  test('Call', () => {
    const engine = new CypherEngine();
    const result = engine.call('apoc.test').cypher;
    expect(result).toBe(`CALL apoc.test`);
  });

  test('MERGE ON CREATE ON MATCH', () => {
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
    expect(result).toBe(`MERGE (n0:Person{name:'Keanu Reeves'})\nON CREATE SET n0.created = 123\nON MATCH SET\nn0.modified = 123 RETURN *`);
  });

  test('MATCH WITH SKIP AND LIMIT', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Creation'], 'n0')
      .returns('n0')
      .skip(10)
      .limit(10)

      .toString();
    expect(result).toBe(`MATCH (n0:Creation)\nRETURN n0 SKIP 10 LIMIT 10`);
  });

  test('MATCH WITH boolean CASE', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Creation'], 'one')
      .match()
      .node(['View'], 'two')
      .case()
      .value('one.condition')
      .when()
      .value('true')
      .then()
      .returns('one')
      .when()
      .value('false')
      .then()
      .returns('two')

      .toString();
    expect(result).toBe(
      `MATCH (one:Creation)\nMATCH (two:View)\nCASE one.condition WHEN true THEN RETURN one WHEN false THEN RETURN two`
    );
  });

  test('MATCH WITH string CASE', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Creation'], 'one')
      .match()
      .node(['View'], 'two')
      .case()
      .value('one.condition')
      .when()
      .value('one')
      .then()
      .returns('one')
      .else()
      .returns('two')

      .toString();
    expect(result).toBe(`MATCH (one:Creation)\nMATCH (two:View)\nCASE one.condition WHEN one THEN RETURN one ELSE RETURN two`);
  });

  test('REMOVE', () => {
    const engine = new CypherEngine();
    const result = engine
      .match()
      .node(['Creation'], 'n')
      .remove()
      .value('n:Creation')
      .returns()

      .toString();
    expect(result).toBe(`MATCH (n:Creation)\nREMOVE n:Creation RETURN *`);
  });
});
