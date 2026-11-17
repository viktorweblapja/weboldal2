import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clockParts,normalize,parseServer,TimeSource} from '../dist/core.js';
const parts=(date,zone)=>clockParts(Date.parse(date),{zone});
test('Budapest spring gap and autumn repeated hour',()=>{
 assert.equal(parts('2026-03-29T00:59:59Z','Europe/Budapest').time,'01:59:59');
 assert.equal(parts('2026-03-29T01:00:00Z','Europe/Budapest').time,'03:00:00');
 assert.equal(parts('2026-10-25T00:30:00Z','Europe/Budapest').offset,120);
 assert.equal(parts('2026-10-25T01:30:00Z','Europe/Budapest').offset,60);
 assert.equal(parts('2026-10-25T01:30:00Z','Europe/Budapest').time,'02:30:00');
});
test('USA and Australian half-hour DST',()=>{
 assert.equal(parts('2026-03-08T07:00:00Z','America/New_York').time,'03:00:00');
 assert.equal(parts('2026-11-01T06:00:00Z','America/New_York').time,'01:00:00');
 assert.equal(parts('2026-04-04T14:59:59Z','Australia/Lord_Howe').offset,660);
 assert.equal(parts('2026-04-04T15:00:00Z','Australia/Lord_Howe').offset,630);
 assert.equal(parts('2026-10-03T15:30:00Z','Australia/Lord_Howe').offset,660);
});
test('fixed offsets, leap day, year boundary, AM PM',()=>{
 for(const offset of [-720,-570,-210,210,270,330,345,390,525,570,630,765,840]){
  const now=Date.parse('2024-02-29T23:30:00Z');
  const p=clockParts(now,{offset});
  assert.equal(p.time,new Date(now+offset*60000).toISOString().slice(11,19));
 }
 assert.equal(clockParts(Date.parse('2025-12-31T23:00:00Z'),{offset:840}).date,'2026. 01. 01.');
 assert.equal(clockParts(Date.parse('2026-01-01T00:00:00Z'),{offset:-720}).date,'2025. 12. 31.');
 assert.equal(clockParts(Date.parse('2026-01-01T00:00:00Z'),{offset:0},true).time,'12:00:00');
 assert.equal(clockParts(Date.parse('2026-01-01T12:00:00Z'),{offset:0},true).period,'PM');
});
test('server validation and accent search',()=>{
 assert.equal(normalize('São Paulo'),'sao paulo');
 assert.throws(()=>parseServer({timeZone:'UTC',dateTime:'bad'}));
 assert.throws(()=>parseServer({timeZone:'Europe/London',dateTime:'2026-01-01T00:00:00'}));
 assert.equal(parseServer({timeZone:'UTC',dateTime:'2026-01-01T00:00:00.0000000'}),Date.UTC(2026,0,1));
});
test('monotonic estimate, resume, restart and system clock change',()=>{
 let wall=100000,mono=0;const time=new TimeSource(()=>wall,()=>mono);
 time.accept(200000,100);mono+=1000;wall+=1000;assert.equal(time.now(),201050);
 mono+=100;wall+=60000;assert.equal(time.now(),wall);assert.equal(time.synced,false);
 assert.equal(new TimeSource(()=>wall,()=>mono).synced,false);
});
