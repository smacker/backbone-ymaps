(function(_, Backbone) {

    Backbone.Ymaps = {};

    // Bind helper
    function backboneBinding(target, obj, eventName, handler, handlerName) {
        if (!handler) {
            throw new Error("Method '" + handlerName + "' was configured as an event handler, but does not exist.");
        }

        target.listenTo(obj, eventName, handler, target);
    }

    function backboneUnbinding(target, obj, eventName, handler) {
        target.stopListening(obj, eventName, handler, target);
    }

    function ymapsBinding(target, obj, eventName, handler) {
        obj.events.add(eventName, handler, target);
    }

    function ymapsUnbinding(target, obj, eventName, handler) {
        obj.events.remove(eventName, handler, target);
    }

    function bindEvents(target, obj, bindings, callback) {
        if (!obj || !bindings) {
            return;
        }

        _.each(bindings, function(handlerName, eventNames) {
            eventNames = eventNames.split(/\s+/);

            _.each(eventNames, function(eventName) {
                var handler = target[handlerName];
                callback(target, obj, eventName, handler, handlerName);
            });
        });
    }

    function unbindEvents(target, obj, bindings, callback) {
        if (!obj || !bindings) {
            return;
        }

        _.each(bindings, function(eventNames, handlerName) {
            eventNames = eventNames.split(/\s+/);

            _.each(eventNames, function(eventName) {
                var handler = target[handlerName];
                callback(target, obj, eventName, handler);
            });
        });
    }

    var BaseClass = function(options) {
        options || (options = {});

        this.cid = _.uniqueId('c');

        // Ensure map and API loaded
        if (!ymaps || !ymaps.Map) throw new Error('Yandex maps API is not loaded.');
        if (!options.map && !this.map) throw new Error('A map must be specified.');

        // Set attributes
        this.map = options.map || this.map;
        this.parent = options.parent;
        this.initialize.apply(this, arguments);
        this.delegateEvents();
    };

    BaseClass.extend = Backbone.Model.extend;

    _.extend(BaseClass.prototype, Backbone.Events, {

        delegateEvents: function() {
            bindEvents(this, this.map, this.mapEvents, ymapsBinding);
        },

        undelegateEvents: function() {
            unbindEvents(this, this.map, this.mapEvents, ymapsUnbinding);
        },

        initialize: function() {

        }

    });

    Backbone.Ymaps.Placemark = BaseClass.extend({
        constructor: function(options) {
            this.model = options.model || this.model;

            // Ensure model
            if (!this.model) throw new Error("A model must be specified for a YmapsPlacemark");

            var geometry = this.getCoordinates(),
                properties = {
                    iconContent: _.result(this, 'iconContent'),
                    hintContent: _.result(this, 'hintContent'),
                    balloonContent: _.result(this, 'balloonContent')
                },
                placemarkOptions = this.placemarkOptions || {};

            this.geoObject = new ymaps.Placemark(geometry, properties, placemarkOptions);
            this.geoObject.model = this.model;

            BaseClass.prototype.constructor.apply(this, arguments);
        },

        delegateEvents: function() {
            BaseClass.prototype.delegateEvents.apply(this, arguments);
            bindEvents(this, this.model, this.modelEvents, backboneBinding);
            bindEvents(this, this.geoObject, this.events, ymapsBinding);
        },

        undelegateEvents: function() {
            BaseClass.prototype.undelegateEvents.apply(this, arguments);
            unbindEvents(this, this.model, this.modelEvents, backboneUnbinding);
            unbindEvents(this, this.geoObject, this.events, ymapsUnbinding);
        },

        modelEvents: {
            'change:lon change:lat': 'updatePlacemarkCoordinates'
        },

        events: {
            'geometrychange': 'updateModelCoordinates'
        },

        styles: {
            green: 'twirl#greenIcon',
            red: 'twirl#redIcon',
            yellow: 'twirl#yellowIcon',
            orange: 'twirl#darkorangeIcon',
            brown: 'twirl#brownIcon'
        },

        updatePlacemarkCoordinates: function() {
            var newCoordinates = this.getCoordinates();

            if (newCoordinates && newCoordinates[0] && newCoordinates[1]) {
                this.geoObject.geometry.setCoordinates(newCoordinates);
            }
        },

        updateModelCoordinates: function() {
            var oldCoordinates = this.getCoordinates(),
                newCoordinates = this.geoObject.geometry.getCoordinates();

            // loop
            if (_.isEqual(oldCoordinates, newCoordinates)) {
                return;
            }

            this.setCoordinates(newCoordinates);
        },

        // Public API
        getCoordinates: function() {
            return [this.model.get('lon'), this.model.get('lat')];
        },

        setCoordinates: function(coordinates) {
            this.model.set({
                'lon': coordinates[0],
                'lat': coordinates[1]
            });
        },

        setStyle: function(style) {
            this.geoObject.options.set('preset', this.styles[style]);
        },

        render: function() {
            this.map.geoObjects.add(this.geoObject);
            return this;
        },

        destroy: function() {
            this.map.geoObjects.remove(this.geoObject);
        }
    });

    Backbone.Ymaps.Polyline = BaseClass.extend({
        constructor: function(options) {
            this.model = options.model || this.model;

            // Ensure model
            if (!this.model) throw new Error("A model must be specified for a YmapsPolyline");

            var geometry = this.getCoordinates(),
                polylineOptions = this.polylineOptions || {};


            this.geoObject = new ymaps.Polyline(geometry, {}, polylineOptions);
            this.geoObject.model = this.model;

            BaseClass.prototype.constructor.apply(this, arguments);
        },

        delegateEvents: function() {
            BaseClass.prototype.delegateEvents.apply(this, arguments);
            bindEvents(this, this.model, this.modelEvents, backboneBinding);
            bindEvents(this, this.geoObject, this.events, ymapsBinding);
        },

        undelegateEvents: function() {
            BaseClass.prototype.undelegateEvents.apply(this, arguments);
            unbindEvents(this, this.model, this.modelEvents, backboneUnbinding);
            unbindEvents(this, this.geoObject, this.events, ymapsUnbinding);
        },

        modelEvents: {
            'change:points': 'updatePolylineCoordinates'
        },

        events: {
            'geometrychange': 'updateModelCoordinates'
        },

        updatePolylineCoordinates: function() {
            var newCoordinates = this.getCoordinates();

            if (newCoordinates && _.isArray(newCoordinates)) {
                this.geoObject.geometry.setCoordinates(newCoordinates);
            }
        },

        updateModelCoordinates: function() {
            var oldCoordinates = this.getCoordinates(),
                newCoordinates = this.geoObject.geometry.getCoordinates();

            // loop
            if (_.isEqual(oldCoordinates, newCoordinates)) {
                return;
            }

            this.setCoordinates(newCoordinates);
            this.trigger('pointschange');
        },

        startEditing: function() {
            this.geoObject.editor.startEditing();
        },

        stopEditing: function() {
            this.geoObject.editor.stopEditing();
        },

        // Public API
        getCoordinates: function() {
            var points = this.model.get('points') || [];
            return _.map(points, function(point) {
                return [point.lon, point.lat]
            });
        },

        setCoordinates: function(coordinates) {
            var points = _.map(coordinates || [], function(pointCoordinates) {
               return {
                   lon: pointCoordinates[0],
                   lat: pointCoordinates[1]
               };
            });
            this.model.set({
                'points': points
            });
        },

        setLineColor: function(color) {
            this.geoObject.options.set('strokeColor', color);
        },

        setLineWidth: function(width) {
            this.geoObject.options.set('strokeWidth', width);
        },

        render: function() {
            this.map.geoObjects.add(this.geoObject);
            return this;
        },

        destroy: function() {
            this.map.geoObjects.remove(this.geoObject);
        }
    });

    Backbone.Ymaps.Polygon = BaseClass.extend({
        constructor: function(options) {
            this.model = options.model || this.model;

            // Ensure model
            if (!this.model) throw new Error("A model must be specified for a YmapsPolygon");

            var geometry = this.getCoordinates(),
                properties = {
                    hintContent: _.result(this, 'hintContent'),
                    balloonContent: _.result(this, 'balloonContent')
                },
                polygonOptions = this.polygonOptions || {};

            this.geoObject = new ymaps.Polygon(geometry, properties, polygonOptions);
            this.geoObject.model = this.model;

            BaseClass.prototype.constructor.apply(this, arguments);
        },

        delegateEvents: function() {
            BaseClass.prototype.delegateEvents.apply(this, arguments);
            bindEvents(this, this.model, this.modelEvents, backboneBinding);
            bindEvents(this, this.geoObject, this.events, ymapsBinding);
        },

        undelegateEvents: function() {
            BaseClass.prototype.undelegateEvents.apply(this, arguments);
            unbindEvents(this, this.model, this.modelEvents, backboneUnbinding);
            unbindEvents(this, this.geoObject, this.events, ymapsUnbinding);
        },

        modelEvents: {
            'change:exterior': 'updatePolylineCoordinates',
            'change:interiors': 'updatePolylineCoordinates'
        },

        updatePolylineCoordinates: function() {
            var newCoordinates = this.getCoordinates();

            if (newCoordinates && _.isArray(newCoordinates)) {
                this.geoObject.geometry.setCoordinates(newCoordinates);
            }
        },

        // Public API
        getCoordinates: function() {
            return [this.model.get('exterior') || [], this.model.get('interiors') || []];
        },

        setFillColor: function(color) {
            this.geoObject.options.set('fillColor', color);
        },

        setStrokeColor: function(color) {
            this.geoObject.options.set('strokeColor', color);
        },

        setStrokeWidth: function(width) {
            this.geoObject.options.set('strokeWidth', width);
        },

        render: function() {
            this.map.geoObjects.add(this.geoObject);
            return this;
        },

        destroy: function() {
            this.map.geoObjects.remove(this.geoObject);
        }
    });

    Backbone.Ymaps.CollectionView = BaseClass.extend({
        constructor: function(options) {
            this.collection = options.collection || this.collection;
            this.geoItem = options.geoItem || this.geoItem;

            // Ensure collection
            if (!this.collection) throw new Error("A collection must be specified for a YmapsCollection");

            this.modelsCache = {};
            this.geoObject = new ymaps.GeoObjectCollection();
            this.geoObject.collection = this.collection;

            BaseClass.prototype.constructor.apply(this, arguments);

            if (this.collection.length) {
                this.resetItems(this.collection);
            }
        },

        delegateEvents: function() {
            BaseClass.prototype.delegateEvents.apply(this, arguments);
            bindEvents(this, this.collection, this.collectionEvents, backboneBinding);
            bindEvents(this, this.geoObject, this.events, ymapsBinding);
        },

        undelegateEvents: function() {
            BaseClass.prototype.undelegateEvents.apply(this, arguments);
            unbindEvents(this, this.collection, this.collectionEvents, backboneUnbinding);
            unbindEvents(this, this.geoObject, this.events, ymapsUnbinding);
        },

        geoItem: Backbone.Ymaps.Placemark,

        collectionEvents: {
            'add': 'addItem',
            'remove': 'removeItem',
            'reset': 'resetItems'
        },

        _removeAllItems: function() {
            _.each(this.modelsCache, function(item, cid) {
                item.undelegateEvents && item.undelegateEvents();
            });
            this.modelsCache = {};
            this.geoObject.removeAll();
        },

        addItem: function(model, collection, options) {
            var item = new this.geoItem({
                model: model,
                map: this.map,
                parent: this
            });

            this.modelsCache[model.cid] = item;
            this.geoObject.add(item.geoObject);
        },

        removeItem: function(model, collection, options) {
            var item = this.modelsCache[model.cid];
            if (item) {
                item.undelegateEvents && item.undelegateEvents();
                this.geoObject.remove(item.geoObject);
                delete this.modelsCache[model.cid];
            }
        },

        resetItems: function(collection, options) {
            this._removeAllItems();

            collection.each(function(item, index) {
                this.addItem(item, collection, options);
            }, this);
        },

        render: function() {
            this.map.geoObjects.add(this.geoObject);
            return this;
        },

        destroy: function() {
            this._removeAllItems();
            this.map.geoObjects.remove(this.geoObject);
        }
    });

})(_, Backbone);
