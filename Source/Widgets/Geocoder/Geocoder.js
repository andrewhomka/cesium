/*global define*/
define([
        '../../Core/defined',
        '../../Core/defineProperties',
        '../../Core/destroyObject',
        '../../Core/DeveloperError',
        '../SvgPath/SvgPath',
        '../getElement',
        './GeocoderViewModel',
        '../../ThirdParty/knockout'
    ], function(
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        SvgPath,
        getElement,
        GeocoderViewModel,
        knockout) {
    "use strict";

    var startSearchPath = 'M29.772,26.433l-7.126-7.126c0.96-1.583,1.523-3.435,1.524-5.421C24.169,8.093,19.478,3.401,13.688,3.399C7.897,3.401,3.204,8.093,3.204,13.885c0,5.789,4.693,10.481,10.484,10.481c1.987,0,3.839-0.563,5.422-1.523l7.128,7.127L29.772,26.433zM7.203,13.885c0.006-3.582,2.903-6.478,6.484-6.486c3.579,0.008,6.478,2.904,6.484,6.486c-0.007,3.58-2.905,6.476-6.484,6.484C10.106,20.361,7.209,17.465,7.203,13.885z';
    var stopSearchPath = 'M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z';

    /**
     * A widget for finding addresses and landmarks, and flying the camera to them.  Geocoding is
     * performed using the <a href="http://msdn.microsoft.com/en-us/library/ff701715.aspx">Bing Maps Locations API</a>.
     *
     * @alias Geocoder
     * @constructor
     *
     * @param {Element|String} description.container The DOM element or ID that will contain the widget.
     * @param {Scene} description.scene The Scene instance to use.
     * @param {String} [description.url='http://dev.virtualearth.net'] The base URL of the Bing Maps API.
     * @param {String} [description.key] The Bing Maps key for your application, which can be
     *        created at <a href='https://www.bingmapsportal.com/'>https://www.bingmapsportal.com/</a>.
     *        If this parameter is not provided, {@link BingMapsApi.defaultKey} is used.
     *        If {@link BingMapsApi.defaultKey} is undefined as well, a message is
     *        written to the console reminding you that you must create and supply a Bing Maps
     *        key as soon as possible.  Please do not deploy an application that uses
     *        this widget without creating a separate key for your application.
     * @param {Ellipsoid} [description.ellipsoid=Ellipsoid.WGS84] The Scene's primary ellipsoid.
     * @param {Number} [description.flightDuration=1500] The duration of the camera flight to an entered location, in milliseconds.
     *
     * @exception {DeveloperError} description.container is required.
     * @exception {DeveloperError} description.scene is required.
     */
    var Geocoder = function(description) {
        if (!defined(description) || !defined(description.container)) {
            throw new DeveloperError('description.container is required.');
        }
        if (!defined(description.scene)) {
            throw new DeveloperError('description.scene is required.');
        }

        var container = getElement(description.container);
        var form = document.createElement('form');
        form.setAttribute('data-bind', 'submit: search');

        var textBox = document.createElement('input');
        textBox.type = 'text';
        textBox.className = 'cesium-geocoder-input';
        textBox.setAttribute('placeholder', 'Enter an address or landmark...');
        textBox.setAttribute('data-bind', 'hasFocus: _isFocused, value: searchText, valueUpdate: "afterkeydown", css: { "cesium-geocoder-input-wide" : searchText.length > 0 }');
        form.appendChild(textBox);

        var goButton = document.createElement('span');
        goButton.className = 'cesium-geocoder-goButton';
        form.appendChild(goButton);

        container.appendChild(form);

        this._container = container;
        this._viewModel = new GeocoderViewModel(description);
        this._form = form;
        this._svgPath = new SvgPath(goButton, 32, 32, startSearchPath);
        knockout.applyBindings(this._viewModel, this._container);

        var that = this;
        this._subscription = knockout.getObservable(this._viewModel, 'isSearchInProgress').subscribe(function(isSearchInProgress) {
            that._svgPath.path = isSearchInProgress ? stopSearchPath : startSearchPath;
        });

        this._onFocusChange = function(e) {
            if (!form.contains(e.target)) {
                that._viewModel.isFocused = false;
            }
        };

        document.addEventListener('mousedown', this._onFocusChange, true);
        document.addEventListener('touchstart', this._onFocusChange, true);
    };

    defineProperties(Geocoder.prototype, {
        /**
         * Gets the parent container.
         * @memberof Geocoder.prototype
         *
         * @type {Element}
         */
        container : {
            get : function() {
                return this._container;
            }
        },

        /**
         * Gets the view model.
         * @memberof Geocoder.prototype
         *
         * @type {GeocoderViewModel}
         */
        viewModel : {
            get : function() {
                return this._viewModel;
            }
        }
    });

    /**
     * @memberof Geocoder
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    Geocoder.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the widget.  Should be called if permanently
     * removing the widget from layout.
     * @memberof Geocoder
     */
    Geocoder.prototype.destroy = function() {
        document.removeEventListener('mousedown', this._onFocusChange, true);
        document.removeEventListener('touchstart', this._onFocusChange, true);
        this._subscription.dispose();

        var container = this._container;
        knockout.cleanNode(container);
        container.removeChild(this._form);
        return destroyObject(this);
    };

    return Geocoder;
});