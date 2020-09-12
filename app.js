if ( 'serviceWorker' in navigator ) {
    navigator.serviceWorker.register('serviceWorker.js');
    navigator.serviceWorker.addEventListener("message", e => {
        switch(e.data.action) {
            case "resources-updated": 
                console.log("The app is ready for an update. Please reload!");
                break;
        }
    });
}

const sendMessageToSW = (message) => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    } else {
        console.log("There is no SW controlling this page");
    }
}

const update = () => {
    sendMessageToSW({ action: "update-resources" });
}

const vote = tourId => {
    if ("SyncManager" in window) {
        // Use Background Sync
        navigator.serviceWorker.getRegistration()
            .then(registration => {
                registration.sync.register(`vote-${tourId}`);
            });
    } else {
        fetch(`/vote.json?id=${tourId}`)
            .then(r => r.json())
            .then(voted => {
                console.log('voted!');
            });
    }
}
