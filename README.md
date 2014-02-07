# Backbone.Ymaps

Backbone JS расширение для работы с Yandex Maps API (v2.0).

## Example

Простой пример:

```javascript
// Create Yandex Map
var map = new ymaps.Map('maps', {
    center: [37.64, 55.76],
    zoom: 12
});

// Create collection
var places = new Backbone.Collection([{
    title: 'Place one',
    lat: 55.768,
    lon: 37.646
}, {
    title: 'Place Two',
    lat: 55.761,
    lon: 37.642
}]);

// Render places
var placesView = new Backbone.Ymaps.CollectionView({
    collection: places,
    map: map
});
placesView.render();
```

Интерактивный пример:

```bash
git co https://github.com/smacker/backbone-ymaps.git
cd backbone-ymaps
python -m SimpleHTTPServer
```

Открыть в браузере http://127.0.0.1:8000

## Components

- Backbone.Ymaps.Placemark
- Backbone.Ymaps.CollectionView
