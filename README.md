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

Интерактивные примеры: [Placemark](http://smacker.github.io/backbone-ymaps/samples/placemark.html) [Polyline](http://smacker.github.io/backbone-ymaps/samples/polyline.html)

Так же их можно открыть локально:

```bash
git clone https://github.com/smacker/backbone-ymaps.git
cd backbone-ymaps
python -m SimpleHTTPServer
```

Открыть в браузере http://127.0.0.1:8000/samples/placemark.html, http://127.0.0.1:8000/samples/popyline.html

## Components

- Backbone.Ymaps.Placemark
- Backbone.Ymaps.Polyline
- Backbone.Ymaps.CollectionView
