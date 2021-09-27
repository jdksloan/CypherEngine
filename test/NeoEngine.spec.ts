import { NeoSetProperty } from '../src/models/NeoSetProperty';
import { NeoProperty } from '../src/models/NeoProperty';
import { NeoEngine } from '../src/engine/NeoEngine';
import { RelationshipDirection } from '../src/models/RelationshipDirection';
import { PathRange } from '../src/models/PathRange';

describe('Test NeoQueryEngine', () => {
  const tenancy = ['Test'];
  const prefix = 'CYPHER runtime=slotted\n';
  beforeEach(() => {
  });

  test('GenerateQuery with empty query', () => {
    const engine = new NeoEngine(...tenancy);
    expect(engine.cypher).toBe(prefix + '');
  });

  test('GenerateQuery with empty query on CallQuery', () => {
    const engine = new NeoEngine();
    engine.callQuery(new NeoEngine(...tenancy));
    expect(engine.cypher).toBe(prefix + `CALL {${''}}`);
  });

  test('Match with string property filter', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`)).returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com'})\nRETURN *`);
  });

  test('Match with number property filter', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['User'], 'n0', new NeoProperty('age', 34)).returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User{age:34})\nRETURN *`);
  });

  test('Match with no filter', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['User', 'Test1'], 'n0').returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User:Test1)\nRETURN *`);
  });

  test('Match with no filter but with limit', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['User', 'Test1'], 'n0').returns().limit(100).toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User:Test1)\nRETURN * LIMIT 100`);
  });

  test('OPTIONAL match with no filter', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.optionalMatch().node(['User', 'Test1'], 'n0').returns().toString();
    expect(result).toBe(prefix + `OPTIONAL MATCH (n0:Elements:\`Test\`:User:Test1)\nRETURN *`);
  });

  test('Two MATCH with two property filters', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`), new NeoProperty('identity', 123))
      .match()
      .node(['Company'], 'n1', new NeoProperty('name', `'test'`), new NeoProperty('identity', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(
      prefix + `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com', identity:123})\nMATCH (n1:Elements:\`Test\`:Company{name:'test', identity:'test'})\nRETURN *`
    );
  });

  test('MATCH RELATES to NODE Tenantless', () => {
    const engine = new NeoEngine();
    const result = engine
      .match()
      .nodeTenantless(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.right, undefined, undefined, new NeoProperty('years', 5))
      .nodeTenantless(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:User{email:'test@test.com'})\n-[:works_for{years:5}]->(n1:Elements:Company{name:'test'})\nRETURN *`);
  });

  test('MATCH RELATES to NODE Tenantless', () => {
    try {
      const engine = new NeoEngine();
      const result = engine
        .match()
        .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
        .relates(['works_for'], RelationshipDirection.right, undefined, undefined, new NeoProperty('years', 5))
        .node(['Company'], 'n1', new NeoProperty('name', `'test'`))
        .returns()
        .toString();
    } catch (error) {
      expect(error.message).toBe('Tenancy is required for this operation');
    }
  });

  test('MATCH RELATES to NODE with 1 to 3 nodes in between', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .nodeTenantless(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.right, undefined, new PathRange(1, 3), new NeoProperty('years', 5))
      .nodeTenantless(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:User{email:'test@test.com'})\n-[:works_for*1..3{years:5}]->(n1:Elements:Company{name:'test'})\nRETURN *`);
  });

  test('MATCH RELATES to NODE with up to 3 nodes in between', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .nodeTenantless(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.right, undefined, new PathRange(undefined, 3), new NeoProperty('years', 5))
      .nodeTenantless(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:User{email:'test@test.com'})\n-[:works_for*..3{years:5}]->(n1:Elements:Company{name:'test'})\nRETURN *`);
  });

  test('MATCH RELATES to NODE with up to 3 nodes in between UNION Tenancy', () => {
    const engine = new NeoEngine(...['Test', 'Test1']);
    const result = engine
      .match()
      .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.right, undefined, new PathRange(undefined, 3), new NeoProperty('years', 5))
      .node(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(
      prefix +
      `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com'})\n-[:works_for*..3{years:5}]->(n1:Elements:\`Test\`:Company{name:'test'})\nRETURN *\nUNION MATCH (n0:Elements:\`Test1\`:User{email:'test@test.com'})\n-[:works_for*..3{years:5}]->(n1:Elements:\`Test1\`:Company{name:'test'})\nRETURN *`
    );
  });

  test('MATCH RELATES to NODE with at least 3 nodes in between', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.right, undefined, new PathRange(3, undefined), new NeoProperty('years', 5))
      .node(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .returns()
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com'})\n-[:works_for*3..{years:5}]->(n1:Elements:\`Test\`:Company{name:'test'})\nRETURN *`);
  });

  test('MATCH RELATES to NODE WITH all', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.right, undefined, undefined, new NeoProperty('years', 5))
      .node(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .with('n0', 'n1')
      .returns()
      .toString();
    expect(result).toBe(
      prefix + `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com'})\n-[:works_for{years:5}]->(n1:Elements:\`Test\`:Company{name:'test'})\nWITH n0,n1\nRETURN *`
    );
  });

  test('MATCH RELATES to NODE WITH DELETE both', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.left, undefined, undefined, new NeoProperty('years', 5))
      .node(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .delete('n0', 'n1')
      .returns()
      .toString();
    expect(result).toBe(
      prefix + `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com'})\n<-[:works_for{years:5}]-(n1:Elements:\`Test\`:Company{name:'test'})\nDELETE n0,n1\nRETURN *`
    );
  });

  test('MATCH RELATES to NODE WITH DETACH DELETE both', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['User'], 'n0', new NeoProperty('email', `'test@test.com'`))
      .relates(['works_for'], RelationshipDirection.undirected, undefined, undefined, new NeoProperty('years', 5))
      .node(['Company'], 'n1', new NeoProperty('name', `'test'`))
      .detach()
      .delete('n0', 'n1')
      .returns()
      .toString();
    expect(result).toBe(
      prefix + `MATCH (n0:Elements:\`Test\`:User{email:'test@test.com'})\n-[:works_for{years:5}]-(n1:Elements:\`Test\`:Company{name:'test'})\nDETACH DELETE n0,n1\nRETURN *`
    );
  });

  test('SET with one NeoProperty', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID'))
      .set(new NeoSetProperty('n0', new NeoProperty('name', '$name'))).cypher;
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nSET n0.name = $name`);
  });

  test('MATCH WHERE', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['User'], 'n0').where().variable('n0', 'name').equals().value('$name').returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User)\nWHERE n0.name = $name RETURN *`);
  });

  test('MATCH WHERE AND CONTAINS NOT', () => {
    const engine = new NeoEngine(...tenancy);
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
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User)\nWHERE n0.name = $name AND NOT n0.email CONTAINS 'test' RETURN *`);
  });

  test('MATCH WHERE OR CONTAINS', () => {
    const engine = new NeoEngine(...tenancy);
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
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:User)\nWHERE n0.name = $name OR n0.email CONTAINS 'test' RETURN *`);
  });

  test('MATCH SET with two NeoProperty', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID'))
      .set(new NeoSetProperty('n0', new NeoProperty('name', '$name')), new NeoSetProperty('n0', new NeoProperty('birthday', '$birthday'))).cypher;
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nSET n0.name = $name, n0.birthday = $birthday`);
  });

  test('MERGE with one property return it', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.merge().node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID')).returns('n0').toString();
    expect(result).toBe(prefix + `MERGE (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nRETURN n0`);
  });

  test('MERGE with multi tenancy error', () => {
    const engine = new NeoEngine('a', 'b');
    try {
      engine.merge().node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID')).returns('n0').toString();
    } catch (error) {
      expect(error.message).toBe('Only exactly one or none tenancy is allowed for merge');
    }
  });

  test('CREATE with one property return it', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.create().node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID')).returns('n0').toString();
    expect(result).toBe(prefix + `CREATE (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nRETURN n0`);
  });

  test('MERGE with multi tenancy error', () => {
    const engine = new NeoEngine('a', 'b');
    try {
      engine.create().node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID')).returns('n0').toString();
    } catch (error) {
      expect(error.message).toBe('Only exactly one or none tenancy is allowed for create');
    }
  });

  test('MATCH with Label using declaredNode', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').where().declaredNode('n0', 'Natural').returns('n0').toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nWHERE (n0:Natural)\nRETURN n0`);
  });

  test('MATCH with Label using declaredNode fails', () => {
    const engine = new NeoEngine(...tenancy);
    try {
      const result = engine.match().node(['Person'], 'n0').where().declaredNode('n', 'Natural').returns('n0').toString();
      expect(result).toBe(`MATCH (n0:Elements:\`Test\`:Person)\nWHERE (n0:Natural)\nRETURN n0`);
    } catch (error) {
      expect(error.message).toBe('Could not find node n');
    }
  });

  test('MATCH WHERE exists', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID')).where().exists('n0', 'name').with().returns('n0').toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nWHERE exists(n0.name)\nWITH *\nRETURN n0`);
  });

  test('MATCH WITH Order', () => {
    const engine = new NeoEngine(...tenancy);
    const sort: Array<{ prop: string; asc: boolean }> = [
      { prop: 'name', asc: true },
      { prop: 'age', asc: true }
    ];
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').orderBy(['n0', 'n1'], sort).returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\nORDER BY n0.name  , n0.age  , n1.name  , n1.age\nRETURN *`);
  });

  test('Condtional true', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').conditional(true, `WHERE n0.name = 'Test'`, '').returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\nWHERE n0.name = 'Test' RETURN *`);
  });

  test('Condtional false', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').conditional(false, `WHERE n0.name = 'Test'`, '').returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\n RETURN *`);
  });

  test('CondtionalFunc true', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0')
      .match()
      .node(['Person'], 'n01')
      .conditionalFunc(
        true,
        (e) => {
          return e.where().variable('n0', 'name').equals().value(`'Test'`);
        },
        (e) => e
      )
      .returns()
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\nWHERE n0.name = 'Test' RETURN *`);
  });

  test('CondtionalFunc false', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0')
      .match()
      .node(['Person'], 'n01')
      .conditionalFunc(
        false,
        (e) => {
          return e.where().variable('n0', 'name').equals().value(`'Test'`);
        },
        (e) => e
      )
      .returns()
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\nRETURN *`);
  });

  test('MATCH WITH Order', () => {
    const engine = new NeoEngine(...tenancy);
    const sort: Array<{ prop: string; asc: boolean }> = [
      { prop: 'name', asc: true },
      { prop: 'age', asc: true }
    ];
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').orderBy(['n0', 'n1'], sort).returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\nORDER BY n0.name  , n0.age  , n1.name  , n1.age\nRETURN *`);
  });

  test('MATCH WITH Order but no parms', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').match().node(['Person'], 'n01').orderBy(['n0', 'n1']).returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nMATCH (n01:Elements:\`Test\`:Person)\nRETURN *`);
  });

  test('MATCH WHERE Starts with', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID'))
      .where()
      .variable('n0', 'name')
      .startsWith()
      .value(`'1a'`)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nWHERE n0.name STARTS WITH '1a' WITH *\nRETURN n0`);
  });

  test('MATCH WHERE ends with', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID'))
      .where()
      .variable('n0', 'name')
      .endsWith()
      .value(`'1a'`)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nWHERE n0.name ENDS WITH '1a' WITH *\nRETURN n0`);
  });

  test('MATCH WHERE greater than with', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID'))
      .where()
      .variable('n0', 'age')
      .greaterThan()
      .value(5)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nWHERE n0.age > 5 WITH *\nRETURN n0`);
  });

  test('MATCH WHERE less than with', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0', new NeoProperty('polyglotID', '$polyglotID'))
      .where()
      .variable('n0', 'age')
      .lessThan()
      .value(5)
      .with()
      .returns('n0')
      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person{polyglotID:$polyglotID})\nWHERE n0.age < 5 WITH *\nRETURN n0`);
  });

  test('MATCH WHERE regular expression with', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').where().variable('n0', 'name').regularExpression().value(`'Tim.*'`).with().returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nWHERE n0.name =~ 'Tim.*' WITH *\nRETURN *`);
  });

  test('MATCH WHERE IS NOT NULL', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').where().variable('n0').is().not().null().returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nWHERE (n0) IS NOT NULL RETURN *`);
  });

  test('MATCH WHERE IN array', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.match().node(['Person'], 'n0').where().variable('n0').in().value([1, 2, 3]).returns().toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Person)\nWHERE (n0) IN [1,2,3] RETURN *`);
  });

  test('CREATE with UNWIND', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Person'], 'n0')
      .unwind()
      .value('{modelItems} as modelItem')
      .merge()
      .variable('n0')
      .relates(['created_by'], RelationshipDirection.left)
      .node(['ModelItem'], 'mi', new NeoProperty('name', 'modelItem.name'))
      .returns()
      .toString();
    expect(result).toBe(
      prefix + `MATCH (n0:Elements:\`Test\`:Person)\nUNWIND {modelItems} as modelItem MERGE (n0) <-[:created_by]-(mi:Elements:\`Test\`:ModelItem{name:modelItem.name})\nRETURN *`
    );
  });

  test('Call', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine.call('apoc.test').cypher;
    expect(result).toBe(prefix + `CALL apoc.test`);
  });

  test('MERGE ON CREATE ON MATCH', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .merge()
      .node(['Person'], 'n0', new NeoProperty('name', `'Keanu Reeves'`))
      .onCreate()
      .set(new NeoSetProperty('n0', new NeoProperty('created', 123)))
      .onMatch()
      .set()
      .variable('n0', 'modified')
      .equals()
      .value(123)
      .returns()
      .toString();
    expect(result).toBe(prefix + `MERGE (n0:Elements:\`Test\`:Person{name:'Keanu Reeves'})\nON CREATE SET n0.created = 123\nON MATCH SET\nn0.modified = 123 RETURN *`);
  });

  test('MATCH WITH SKIP AND LIMIT', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Creation'], 'n0')
      .returns('n0')
      .skip(10)
      .limit(10)

      .toString();
    expect(result).toBe(prefix + `MATCH (n0:Elements:\`Test\`:Creation)\nRETURN n0 SKIP 10 LIMIT 10`);
  });

  test('MATCH WITH boolean CASE', () => {
    const engine = new NeoEngine(...tenancy);
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
      prefix + `MATCH (one:Elements:\`Test\`:Creation)\nMATCH (two:Elements:\`Test\`:View)\nCASE one.condition WHEN true THEN RETURN one WHEN false THEN RETURN two`
    );
  });

  test('MATCH WITH string CASE', () => {
    const engine = new NeoEngine(...tenancy);
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
    expect(result).toBe(prefix + `MATCH (one:Elements:\`Test\`:Creation)\nMATCH (two:Elements:\`Test\`:View)\nCASE one.condition WHEN one THEN RETURN one ELSE RETURN two`);
  });

  test('REMOVE', () => {
    const engine = new NeoEngine(...tenancy);
    const result = engine
      .match()
      .node(['Creation'], 'n')
      .remove()
      .value('n:Creation')
      .returns()

      .toString();
    expect(result).toBe(prefix + `MATCH (n:Elements:\`Test\`:Creation)\nREMOVE n:Creation RETURN *`);
  });
});
