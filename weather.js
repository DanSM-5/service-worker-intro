window.addEventListener("load", () => {
    document.querySelector("ul#weather").innerHTML = "";
    Promise.all([fetchWeather("san diego"), fetchWeather("sacramento"), fetchWeather("fresno")])
        .then(responses => {
            responses.forEach(response => {
                response.json()
                    .then(data => {
                        const weatherSection = document.querySelector("ul#weather");
                        if (data[0].error) {
                            weatherSection.innerHTML += `<li>Offline</li>`; 
                        } else {
                            const li = `<li>${data[0].name}: 
                                    ${Math.round(data[0].forecast[0].temp_min)}F -
                                    ${Math.round(data[0].forecast[0].temp_max)}F</li>`;
                            weatherSection.innerHTML += li;
                        }
                    })
            })
        })
});

function fetchWeather(city) {
    return fetch("http://explorecalifornia.org/api/weather/?city=" + encodeURIComponent(city));
}