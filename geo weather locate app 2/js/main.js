
// App_NAME = "Geo locate web application";
// Application version 0.0.1


const DEFAULT_PLACE = "Dallas, TX";
const DEFAULT_DISPLAY_MODE = "temperature";
const DEFAULT_RANGE_MODE = "hourly";

const PATH_API_KEY = "api_key.txt";

var map;

var geocoder;

var forecast;

var forecast_canvas;

var forecast_context;

var forecast_chart;

var visualization_data;

var display_mode;

var range_mode;

var user_address;

var user_location;

var user_date;

var local_storage;

// update chart info
function display_update()
{

    visualization_data = processForecast(forecast);

    visualize(visualization_data, display_mode);
}

// initialize map

function initialize()
{

    var map_options =
        {
            zoom : 8,
        };
    map = new google.maps.Map($('#map')[0], map_options);
    geocoder = new google.maps.Geocoder();

    forecast_chart = null;
    forecast_canvas = $('#forecast_chart')[0];
    forecast_context = forecast_canvas.getContext("2d");

    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(
            function(position)
            {
                var location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                geocoder.geocode({'latLng': location},
                    function(geocoder_result, status)
                    {
                        if (status == google.maps.GeocoderStatus.OK)
                        {
                            user_address = geocoder_result[0].formatted_address;

                            location_update(location);
                        }
                    }
                );
            }
        );
    }

    else
    {
        geocode(DEFAULT_PLACE);
    }

    if (Modernizr.localstorage)
    {
        local_storage = window.localStorage;
    }

    else
    {
        local_storage = null;
        $('#clear_history').hide();
    }


    display_mode = DEFAULT_DISPLAY_MODE;
    $('#display_mode_' + DEFAULT_DISPLAY_MODE).addClass('selected');


    range_mode = DEFAULT_RANGE_MODE;
    $('#range_mode_' + DEFAULT_RANGE_MODE).addClass('selected');

    history_update();

    initialize_callbacks();

}

// Get location info

function geocode(place)
{
    var geocoder_request =
        {
            "address" : place,
        }

    geocoder.geocode(geocoder_request,
        function(geocoder_result, status)
        {
            if (status == google.maps.GeocoderStatus.OK)
            {
                user_address= place;
                location_update(geocoder_result[0].geometry.location);
            }
        }
    );
}

// Update the user's current forecast location.
function location_update(location)
{
    user_location = location;
    map.setCenter(user_location);
    get_weather(user_location);
}

// fetch forecast JSON object through forecast.io
function get_weather(location)
{
    $.ajax({
        url : PATH_API_KEY,
        dataType : 'text',
        success : function(api_key)
        {

                // Create Forecast.io URL.
                var forecast_url = "https://api.forecast.io/forecast/" + api_key + "/" + location.lat() + "," + location.lng();
                if (user_date != undefined && !isNaN(user_date))
                {
                    forecast_url += "," + user_date;
                }
                // Grab forecast JSON from Forecast.io API.
                $.ajax({
                    url : forecast_url,
                    dataType : 'jsonp',
                    crossDomain : true,
                    success : function(data)
                    {
                        // Update the last-queried forecast.
                        forecast = data;
                        // Update visual chart from forecast data.
                        display_update();
                    },
                    error : function(error)
                    {
                        console.log(LOG_ERROR + "Error calling Forecast.io.");
                    }
                });

        },
        error : function(error)
        {
            console.log(LOG_ERROR + "Error obtaining Forecast.io API key.");
        }
    });
}


// handle forecast json obeject get data sets to be visualized
function processForecast(forecast)
{
    var visualization_data =
        {
            temperature_data : {},
            humidity_data :
                {
                    labels : [],
                    datasets :
                        [
                            {
                                label : "Humidity",
                                fillColor :"rgba(128, 128, 200, 0.2)",
                                strokeColor : "rgba(128, 128, 200, 1)",
                                pointColor : "rgba(128, 128, 200, 1)",
                                pointStrokeColor : "#FFFFFF",
                                pointHighlightFill : "#FFFFFF",
                                pointHighlightStroke : "rgba(128, 128, 200, 1)",
                                data: []
                            }
                        ]
                },
            pressure_data :
                {
                    labels : [],
                    datasets :
                        [
                            {
                                label : "Pressure",
                                fillColor :"rgba(255, 206, 86, 1)",
                                strokeColor : "rgba(255, 206, 86, 1)",
                                pointColor : "rgba(255, 206, 86, 1)",
                                pointStrokeColor : "#FFFFFF",
                                pointHighlightFill : "#FFFFFF",
                                pointHighlightStroke : "rgba(255, 206, 86, 1)",
                                data: []
                            }
                        ]
                },

            precipitation_data :
                {
                    labels : [],
                    datasets :
                        [
                            {
                                label : "Precipitation Probability",
                                fillColor :"rgba(151,187,205,0.2)",
                                strokeColor : "rgba(151,187,205,1)",
                                pointColor : "rgba(151,187,205,1)",
                                pointStrokeColor : "#FFFFFF",
                                pointHighlightFill : "#FFFFFF",
                                pointHighlightStroke : "rgba(128, 128, 200, 1)",
                                data: []
                            }
                        ]
                },
            wind_data :
                {
                    labels : [],
                    datasets :
                        [
                            {
                                label : "Wind Speed",
                                fillColor :"rgba(127, 255, 212, 0.5)",
                                strokeColor : "rgba(127, 255, 212, 1)",
                                pointColor : "rgba(127, 255, 212, 1)",
                                pointStrokeColor : "#FFFFFF",
                                pointHighlightFill : "#FFFFFF",
                                pointHighlightStroke : "rgba(127, 255, 212, 1)",
                                data: [],
                            }
                        ]
                },
            summary : "",

        }

    // choose time range mode

    if (range_mode == "hourly")
    {
        // Initialize chart input.
        visualization_data["temperature_data"]["labels"] = [];
        visualization_data["temperature_data"]["datasets"] =
            [
                {
                    "label" : "Temperature",
                    "fillColor" :"rgba(220, 120, 120, 0.2)",
                    "strokeColor" : "rgba(220, 120, 120, 1)",
                    "pointColor" : "rgba(220, 120, 120, 1)",
                    "pointStrokeColor" : "#FFFFFF",
                    "pointHighlightFill" : "#FFFFFF",
                    "pointHighlightStroke" : "rgba(220, 120, 120, 1)",
                    data: [],
                },
            ];


        for (var i = 0; i <  forecast["hourly"]["data"].length; ++i)
        {
            visualization_data["temperature_data"]["labels"][i] = new Date(forecast["hourly"]["data"][i]["time"] * 1000).toLocaleString();
            visualization_data["temperature_data"]["datasets"][0]["data"][i] = Math.round(forecast["hourly"]["data"][i]["temperature"]);
        }

        visualization_data["summary"] = forecast["hourly"]["summary"];
    }
    else if (range_mode == "daily")
    {
        // Initialize chart input.
        visualization_data["temperature_data"]["labels"] = [];
        visualization_data["temperature_data"]["datasets"] =
            [
                {
                    "label" : "High Temperature",
                    "fillColor" :"rgba(220, 120, 120, 0.2)",
                    "strokeColor" : "rgba(220, 120, 120, 1)",
                    "pointColor" : "rgba(220, 120, 120, 1)",
                    "pointStrokeColor" : "#FFFFFF",
                    "pointHighlightFill" : "#FFFFFF",
                    "pointHighlightStroke" : "rgba(220, 120, 120, 1)",
                    data: [],
                },
                {
                    "label" : "Low Temperature",
                    "fillColor" : "rgba(0, 255, 255, 0.4)",
                    "strokeColor" : "rgba(0, 255, 255, 1)",
                    "pointColor" : "rgba(0, 255, 255, 1)",
                    "pointStrokeColor" : "#FFFFFF",
                    "pointHighlightFill" : "#FFFFFF",
                    "pointHighlightStroke" : "rgba(0, 255, 255, 1)",
                    data: [],
                },
            ];


        for (var i = 0; i < forecast["daily"]["data"].length; i++)
        {
            visualization_data["temperature_data"]["labels"][i] = new Date(forecast["daily"]["data"][i]["time"] * 1000).toDateString();
            visualization_data["temperature_data"]["datasets"][0]["data"][i] = Math.round(forecast["daily"]["data"][i]["temperatureMax"]);
            visualization_data["temperature_data"]["datasets"][1]["data"][i] = Math.round(forecast["daily"]["data"][i]["temperatureMin"]);
        }

        visualization_data["summary"] = forecast["daily"]["summary"];
    }

    for (var i = 0; i < forecast[range_mode]["data"].length; i++)
    {
        visualization_data["humidity_data"]["labels"][i] = new Date(forecast[range_mode]["data"][i]["time"] * 1000).toLocaleString();
        visualization_data["humidity_data"]["datasets"][0]["data"][i] = forecast[range_mode]["data"][i]["humidity"];
    }
    for (var i = 0; i < forecast[range_mode]["data"].length; i++)
    {
        visualization_data["pressure_data"]["labels"][i] = new Date(forecast[range_mode]["data"][i]["time"] * 1000).toLocaleString();
        visualization_data["pressure_data"]["datasets"][0]["data"][i] = forecast[range_mode]["data"][i]["pressure"];
    }

    for (var i = 0; i < forecast[range_mode]["data"].length; i++)
    {
        visualization_data["precipitation_data"]["labels"][i] = new Date(forecast[range_mode]["data"][i]["time"] * 1000).toLocaleString();
        visualization_data["precipitation_data"]["datasets"][0]["data"][i] = forecast[range_mode]["data"][i]["precipProbability"];
    }


    for (var i = 0; i < forecast[range_mode]["data"].length; i++)
    {
        visualization_data["wind_data"]["labels"][i] = new Date(forecast[range_mode]["data"][i]["time"] * 1000).toLocaleString();
        visualization_data["wind_data"]["datasets"][0]["data"][i] = Math.round(forecast[range_mode]["data"][i]["windSpeed"]);
    }

    return visualization_data;
}

// handle charts data

function visualize(visualization_data, display_mode)
{
    var temperature_options =
        {
            multiTooltipTemplate : "<%= value %> F",
            pointHitDetectionRadius : 13,
            tooltipTemplate : "<%if (label){%><%=label%>: <%}%><%= value %> F",
        };
    var humidity_options =
        {
            pointHitDetectionRadius : 13,
            tooltipTemplate : "<%if (label){%><%=label%>: <%}%><%= value %> %",
        };
    var precipitation_options =
        {
            pointHitDetectionRadius : 13,
            tooltipTemplate : "<%if (label){%><%=label%>: <%}%><%= value %> %",
        };
    var wind_options =
        {
            multiTooltipTemplate : "<%= value %> MPH",
            pointHitDetectionRadius : 13,
            tooltipTemplate : "<%if (label){%><%=label%>: <%}%><%= value %> MPH",
        };
    var pressure_options =
        {
            multiTooltipTemplate : "<%= value %> PA",
            pointHitDetectionRadius : 13,
            tooltipTemplate : "<%if (label){%><%=label%>: <%}%><%= value %> PA",
        };
    if (forecast_chart != null)
    {
        forecast_chart.destroy();
    }

    if (display_mode == "precipitation")
    {
        forecast_chart = new Chart(forecast_context).Line(visualization_data["precipitation_data"], precipitation_options);
    }
    else if (display_mode == "wind")
    {
        forecast_chart = new Chart(forecast_context).Line(visualization_data["wind_data"], wind_options);
    }
    else if (display_mode == "humidity")
    {
        forecast_chart = new Chart(forecast_context).Line(visualization_data["humidity_data"], humidity_options);
    }
    else if (display_mode == "pressure")
    {
        forecast_chart = new Chart(forecast_context).Line(visualization_data["pressure_data"], pressure_options);
    }
    else
    {
        forecast_chart = new Chart(forecast_context).Line(visualization_data["temperature_data"], temperature_options);
    }

    forecast_chart.update();

    $('#forecast_summary').html("<strong>Forecast Summary: </strong>" + visualization_data["summary"]);


    $('#forecast_place').html("<strong>Place: </strong>" + user_address);
}


function history_add(place, date)
{
    if (local_storage)
    {
        var entry = place;
        if (new Date(parseInt(date)) != "Invalid Date")
        {
            entry += "|" + date;
        }

        console.log(LOG_INFORMATION + "Adding to user history: " + entry + ".");
        local_storage.setItem(new Date(), entry);
        history_update();
    }
}


function history_update()
{
    if (local_storage)
    {

        $('#history_list').empty();

        for (var i = 0; i < local_storage.length; ++i)
        {
            var value = local_storage.getItem(local_storage.key(i));
            var splitValue = value.split("|");
            var history_list_entry = "<li><button class=\"history_list_entry\" value=" + value.split(" ").join("_") + "><strong>Address:</strong> " + splitValue[0];
            if (splitValue.length == 2)
            {
                history_list_entry += "<span class=\"history_list_entry_date\"><strong>\tDate:</strong> " + new Date(parseInt(splitValue[1]) * 1000).toLocaleDateString() + "</span>";
            }

            $('#history_list').prepend(history_list_entry);
        }

        if (local_storage.length == 0)
        {
            $('#history_list').append("<p>No History Log</p>");
        }

        $('.history_list_entry').dblclick(
            function()
            {
                history_autofill($(this).val().split("_").join(" "));
            }
        );
    }
    else
    {
        $('#history_list').append("<h3>HTML5 Local Storage is not supported by your browser. Sorry!</h3>");
    }
}

function history_autofill(query)
{
    if (local_storage)
    {
        var splitQuery = query.split("|");
        $('#place').val(splitQuery[0]);

        // Autofill the "Date" input box with either a valid given date, or a default value. Convert back from the local timezone offset to UTC, as the date input works in UTC.
        if (splitQuery.length == 2)
        {
            var local_date = new Date(parseInt(splitQuery[1] * 1000));
            $('#date').val(new Date((splitQuery[1] * 1000) - (local_date.getTimezoneOffset() * 60)).toISOString().slice(0, 10));
        }
        else
        {
            $('#date').val("");
        }
        $('#date').trigger('change',true);
    }
}

// Clear entire user history.
function history_clear()
{

    if (local_storage)
    {
        console.log(LOG_INFORMATION + "Clearing user search history.");
        local_storage.clear();

        history_update();
    }
}



function initialize_callbacks()
{
    google.maps.event.addListener(map, "dblclick",
        function(e)
        {
            geocoder.geocode({'latLng': e.latLng},
                function(geocoder_result, status)
                {

                    if (status == google.maps.GeocoderStatus.OK)
                    {
                        $('#place').val(geocoder_result[0].formatted_address);
                    }
                }
            );
        }
    );

    $('#get_weather').click(
        function()
        {
            var utc_date = new Date($('#date').val());
            user_date = (utc_date.getTime() / 1000) + (utc_date.getTimezoneOffset() * 60);

            var place = $('#place').val();
            if (place === "")
            {
                place = DEFAULT_PLACE
            }
            geocode(place);

            history_add(place, user_date);
        }
    );

    $('.display_mode').click(
        function()
        {
            if (!$(this).hasClass('selected'))
            {
                display_mode = $(this).val();
                $('.display_mode').removeClass('selected');
                $(this).addClass('selected');

                display_update();
            }
        }
    );

    $('.range_mode').click(
        function()
        {
            if (!$(this).hasClass('selected'))
            {
                range_mode = $(this).val();
                $('.range_mode').removeClass('selected');
                $(this).addClass('selected');

                display_update();
            }
        }
    );

    $('#place').keypress(
        function(event)
        {
            if (event.keyCode == 13)
            {
                $('#get_weather').trigger('click');
            }
        }
    );

    $('#clear_history').click(history_clear);
}

$(document).ready(initialize);
