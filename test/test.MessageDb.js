'use strict';

var chai = require('chai');
var should = chai.should;
var expect = chai.expect;

var levelup = require('levelup');
var memdown = require('memdown');
var microtime = require('microtime');
var MessageDb = require('../lib/MessageDb');
var bitcore = require('bitcore');
var SIN = bitcore.SIN;
var Key = bitcore.Key;
var AuthMessage = bitcore.AuthMessage;

describe('MessageDb', function() {
  var opts = {
    name: 'test-MessageDb',
    db: levelup({
      db: memdown,
      sync: true,
      valueEncoding: 'json'
    })
  };
  it('should be able to create instance', function() {
    var mdb = new MessageDb(opts);
    expect(mdb).to.exist;
  });
  it('should be able to create default instance', function() {
    var mdb = MessageDb.default();
    expect(mdb).to.exist;
  });
  var fpk = Key.generateSync();
  var tpk = Key.generateSync();
  var from = fpk.public.toString('hex');
  var to = tpk.public.toString('hex');
  var messageData = {
    a: 1,
    b: 2
  };
  var messageData2 = {};
  var messageData3 = ['a', 'b'];
  var message = AuthMessage.encode(to, fpk, messageData);
  var message2 = AuthMessage.encode(to, fpk, messageData2);
  var message3 = AuthMessage.encode(to, fpk, messageData3);
  it('should be able to add and read a message', function(done) {
    var mdb = new MessageDb(opts);
    var lower_ts = microtime.now();
    mdb.addMessage(message, function(err) {
      expect(err).to.not.exist;
      var upper_ts = microtime.now();
      mdb.getMessages(from, to, lower_ts, upper_ts, function(err, messages) {
        expect(err).to.not.exist;
        messages.length.should.equal(1);
        messages[0].ts.should.be.below(upper_ts);
        messages[0].ts.should.be.above(lower_ts);
        var m = AuthMessage.decode(tpk, messages[0]).payload;
        m.a.should.equal(1);
        m.b.should.equal(2);
        done();
      });
    });
  });
  it('should be able to add many messages and read them', function(done) {
    var mdb = new MessageDb(opts);
    var lower_ts = microtime.now();
    mdb.addMessage(message, function(err) {
      expect(err).to.not.exist;
      mdb.addMessage(message2, function(err) {
        expect(err).to.not.exist;
        var upper_ts = microtime.now();
        setTimeout(function() {
          mdb.addMessage(message3, function(err) {
            expect(err).to.not.exist;
            mdb.getMessages(from, to, lower_ts, upper_ts, function(err, messages) {
              expect(err).to.not.exist;
              messages.length.should.equal(2);
              messages[0].ts.should.be.below(upper_ts);
              messages[0].ts.should.be.above(lower_ts);
              var m0 = AuthMessage.decode(tpk, messages[0]).payload;
              JSON.stringify(m0).should.equal('{"a":1,"b":2}');
              messages[1].ts.should.be.below(upper_ts);
              messages[1].ts.should.be.above(lower_ts);
              var m1 = AuthMessage.decode(tpk, messages[1]).payload;
              JSON.stringify(m1).should.equal('{}');
              done();
            });
          });
        }, 10);
      });
    });
  });
  it('should be able to close instance', function() {
    var mdb = new MessageDb(opts);
    mdb.close();
    expect(mdb).to.exist;
  });
});
