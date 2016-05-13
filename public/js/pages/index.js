(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var FlickerView = require('./animations/FlickerView');
var SlideIntoView = require('./animations/SlideIntoView');
var ClickScrollView = require('./buttons/ClickScrollView');
var AlwaysOnTopManagerView = require('./ui/AlwaysOnTopManagerView');

var HorizontalPanelView = Backbone.View.extend({
    w: null,
    layout: null,
    scaleFactor: 1,
    alwaysOnTopManager: null,
    initialize: function(options) {
        var that = this;
        that.w = $(window);
        that.layout = options.layout;

        // figure out the scale multiplier
        that.scaleFactor = that.w.width() / that.layout.panel.width;

        // always on top manager keeps the menu on top
        that.alwaysOnTopManager = new AlwaysOnTopManagerView({
          el: window,
          parent: that
        });

        // start infinite animations
        _.each($(that.el).find('.object'), function(e, i){
            e = $(e);
            var object = _.findWhere(that.layout.objects, {'id': e.attr('id')});

            // rotate
            if (e.hasClass('rotate')) {
              var repeatTimeline = new TimelineMax({repeat:-1});
              repeatTimeline.add(TweenMax.to(e, object.rotate.duration, {rotationZ: object.rotate.degrees, ease: Power0.easeNone}));
            }

            if (e.hasClass('flicker')) {
              var flickerView = new FlickerView({
                el: '#' + e.attr('id'),
                object: object
              });
            }

            if (e.hasClass('slide-in')) {
              var slideIntoView = new SlideIntoView({
                el: '#' + e.attr('id'),
                object: object,
                scaleFactor: that.scaleFactor
              });
            }

            if (e.hasClass('click-scroll')) {
              var clickScrollView = new ClickScrollView({
                el: '#' + e.attr('id'),
                object: object,
                parent: that
              });
            }

            if (e.hasClass('always-on-top')) {
              that.alwaysOnTopManager.addObject(object);
            }

        });

        _.each($(that.el).find('.text'), function(e, i){
            e = $(e);
            var object = _.findWhere(that.layout.text, {'id': e.attr('id')});
            if (e.hasClass('slide-in')) {
              var slideIntoView = new SlideIntoView({
                el: '#' + e.attr('id'),
                object: object,
                scaleFactor: that.scaleFactor
              });
            }
        });

        // rescale on window resize
        that.w.resize(_.bind($.debounce(250, that.resize), that));
        that.resize();
    },
    resize: function(){
      var that = this;

      // figure out the scale multiplier
      that.scaleFactor = that.w.width() / that.layout.panel.width;

      that.alwaysOnTopManager.adjust();

      $(that.el).css({
        marginTop: (that.w.height() - that.scaleFactor * that.layout.panel.height) / 2
      });

      _.each($(that.el).find('.object'), function(e, i){
          e = $(e);
          var object = _.findWhere(that.layout.objects, {'id': e.attr('id')});
          e.css({
            width: that.scaleFactor * object.dimensions.width,
            height: that.scaleFactor * object.dimensions.height,
            top: that.scaleFactor * object.location.top,
            left: that.scaleFactor * object.location.left
          });
      });

      _.each($(that.el).find('.text'), function(e, i){
          e = $(e);
          var object = _.findWhere(that.layout.text, {'id': e.attr('id')});
          e.css({
            width: that.scaleFactor * object.dimensions.width,
            height: that.scaleFactor * object.dimensions.height,
            top: that.scaleFactor * object.location.top,
            left: that.scaleFactor * object.location.left
          });
      });
    }
});

module.exports = HorizontalPanelView;

},{"./animations/FlickerView":2,"./animations/SlideIntoView":3,"./buttons/ClickScrollView":4,"./ui/AlwaysOnTopManagerView":5}],2:[function(require,module,exports){
var FlickerView = Backbone.View.extend({
    initialize: function(options) {
        var that = this;
        that.object = options.object;
        setTimeout(function(){
            that.flicker();
        }, that.object.flicker.delay * 1000);

    },
    flicker: function() {
        var that = this;
        duration = that.object.flicker.min_duration + Math.random() * that.object.flicker.max_duration;
        var tm = new TweenMax($(that.el), duration, {
          opacity: that.object.flicker.min_opacity + Math.random() * that.object.flicker.max_opacity,
          onComplete: function(){
            that.flicker();
          }
        });
    }
});

module.exports = FlickerView;

},{}],3:[function(require,module,exports){
var SlideIntoView = Backbone.View.extend({
    object: null,
    scaleFactor: 1,
    initialize: function(options) {
        var that = this;
        that.object = options.object;
        if (options.scaleFactor!=undefined) {
          that.scaleFactor = options.scaleFactor;
        }
        that.slideIn();
    },
    slideIn: function() {
        var that = this;
        $(that.el).css('opacity', 1);
        var tm = new TweenLite.fromTo($(that.el), that.object.slide_in.duration,
          {
            top: that.scaleFactor * that.object.slide_in.top,
            left: that.scaleFactor * that.object.slide_in.left
          },
          {
            top: that.scaleFactor * that.object.location.top,
            left: that.scaleFactor * that.object.location.left
          }
        );
    }
});

module.exports = SlideIntoView;

},{}],4:[function(require,module,exports){
var ClickScrollView = Backbone.View.extend({
    object: null,
    parent: null,
    initialize: function(options) {
        var that = this;
        that.object = options.object;
        that.parent = options.parent;
        $(that.el).click(function(){
          that.clickScroll();
        });
    },
    clickScroll: function() {
        var that = this;
        TweenLite.to(
          window,
          that.object.click_scroll.duration,
          {
            scrollTo:{
              x: that.parent.scaleFactor * that.object.click_scroll.scroll_x
            },
            ease: Power2.easeOut
          }
        );
    }
});

module.exports = ClickScrollView;

},{}],5:[function(require,module,exports){
var AlwaysOnTopManagerView = Backbone.View.extend({
    objects: [],
    parent: null,
    initialize: function(options) {
        var that = this;
        that.parent = options.parent;
        that.parent.w.scroll(_.bind($.debounce(100, that.adjust), that));
    },
    addObject: function(object) {
        var that = this;
        that.objects.push(object);
    },
    adjust: function() {
        var that = this;
        _.each(that.objects, function(object,i){
            console.log(object);
            TweenLite.to(
              $('#' + object.id),
              object.always_on_top.duration,
              {
                left: (that.parent.scaleFactor * object.location.left) + that.el.scrollX,
                ease: Elastic.easeOut.config(0.8, 0.3),
                delay: Math.random() * 0.15
              }
            );
        });

    }
});

module.exports = AlwaysOnTopManagerView;

},{}],6:[function(require,module,exports){
var HorizontalPanelView = require('../library/views/HorizontalPanelView');

var horizontalPanelView = new HorizontalPanelView({
    el: '#container',
    layout: layout
});

},{"../library/views/HorizontalPanelView":1}]},{},[6]);
