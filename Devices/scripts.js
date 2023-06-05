sync function onload() {

        var scripts = ['app.js'];

        if (typeof jQuery != 'undefined') {
                console.log("jQuery loaded...");
        }

        for(let i=0;i<scripts.length;i++) {
                if (typeof jQuery == 'undefined') {
                        await startTask(scripts[i],5);
                } else {
                        await importScript(scripts[i]);
                }
        }
}

onload();
