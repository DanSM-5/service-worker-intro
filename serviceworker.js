const precachedList = [
    "/", "mission.html", "resources.html", "tours.html", 
    "app.js", "weather.js", "offline.json",
    "_images/back_bug.gif", "_images/desert_desc_bug.gif", "_images/nature_desc_bug.gif",
    "_images/backpack_bug.gif", "_images/flag.jpg", "_images/snow_desc_bug.gif",
    "_images/calm_bug.gif", "_images/home_page_back.jpg","_images/springs_desc_bug.gif",
    "_images/calm_desc_bug.gif", "_images/kids_desc_bug.gif", "_images/star_bullet.gif",
    "_images/cycle_desc_bug.gif", "_images/logo.gif", "_images/taste_bug.gif",
    "_images/cycle_logo.png", "_images/looking.jpg", "_images/taste_desc_bug.gif",
    "_images/desert_bug.gif", "_images/mission_look.jpg", "_images/tour_badge.png",
    "_css/fonts.css", "_css/main.css", "_css/mobile.css", "_css/tablet.css",
];

const CACHE_NAME_KEY = "california-assets-v3";
//const CACHE_CSS = "california-CSS";
const CACHE_FONTS_KEY = "california-fonts";
const CALIFORNIA_HOST = "explorecalifornia.org";

/**
 * @name fetchAndSave
 * @description Fetches a request and saves the response to Cache Storage
 * @param {object} req Request object from fetch event
 * @param {string} key Key to identify the cached value in Cache Storage
 * @returns {promise} Promise for the response 
 */
const fetchAndSave = (req, key) => fetch(req)
    .then(networkResponse => {
        return caches.open(key)
            .then(cache => {
                cache.put(req, networkResponse.clone());
                return networkResponse;
            });
    });

/**
 * @name saveAll
 * @description Save files in cache storage with the key provided as the name
 * @param {namesArr} namesArr Array that contains the names of the files to be cached
 * @param {key} key Key to identify the cached that is being saved
 */
const saveAll = (namesArr, key) => {
    caches.open(key)
        .then(cache => {
            cache.addAll(namesArr)
                .then( () => {
                    alertPagesUpdate();
                });
        });
}

const alertPagesUpdate = () => {
    clients.matchAll({
        includeUncontrolled: false,
        type: "window"
    }).then(clients => {
        clients.forEach(c => {
            c.postMessage({
                action: "resources-updated"
            });
        });
    })
}

self.addEventListener("install", e => {
    e.waitUntil(
        saveAll(precachedList, CACHE_NAME_KEY)
    );
});

self.addEventListener("activate", e => {
    const cacheWhiteList = [ CACHE_FONTS_KEY, CACHE_NAME_KEY ];
    e.waitUntil(
        caches.keys()
            .then(names => {
                Promise.all(names.map(cacheKey => 
                    cacheWhiteList.indexOf(cacheKey) !== -1 ? null : caches.delete(cacheKey)));
            })
    );
});

self.addEventListener("message", e => {
    const message = e.data;
    switch(message.action) {
        case "update-resources":
            saveAll(precachedList, CACHE_NAME_KEY);
            break;
    }
});

self.addEventListener("sync", e => {
    if(e.tag.substring(0, 4) === "vote") {
    const tourId = e.tag.substring(5);
    e.waitUntil(
        fetch(`/vote.json?id=${tourId}`)
            .then(r => r.json())
            .then(voted => {
                console.log('sync: voted!');
            })
    );
    }
});

self.addEventListener("fetch", e => {

    const parsedUrl = new URL(e.request.url);

    if (!navigator.onLine && parsedUrl.host === CALIFORNIA_HOST) {
        return e.respondWith(fetch("offline.json"));
    }

    if (parsedUrl.pathname.match(/^\/_css*/)) {
        // Network-first policy
        // e.respondWith(
        //     fetch(e.request)
        //         .catch(err => {
        //             return caches.match(e.request);
        //         })
        // );

        // Stay while Revalidate policy
        e.respondWith(
            caches.match(e.request)
                .then(res => {
                    const fetchRequest = fetchAndSave(e.request, CACHE_NAME_KEY);
                    return res || fetchRequest;
                })
        );
    } else {
        // Cached-first policy
        e.respondWith(
            caches.match(e.request)
                .then(res => {
                    if (res) {
                        return res; // Cached from the url
                    } else {
                        // Cache fonts after browser determines version
                        if (parsedUrl.pathname.match(/^\/_fonts*/)) {
                            const fetchRequest = fetchAndSave(e.request, CACHE_FONTS_KEY);
                            return fetchRequest;
                        } else{
                            return fetch(e.request); // Go to the network
                        }
                    }
                })
        );
    }

});