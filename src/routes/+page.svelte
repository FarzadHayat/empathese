<script lang="ts">
    import AppBar from '$lib/AppBar.svelte';
    import DialogueInput from '$lib/DialogueInput.svelte';
    
    import { onMount } from 'svelte';

    let youSaid: string, theySaid: string, relationship: string, quality: string;
    let loading = false;

    // Subscribe to the store changes on component mount
    onMount(() => {
        youSaid = sessionStorage.getItem("youSaid") || "";
        theySaid = sessionStorage.getItem("theySaid") || "";
        relationship = sessionStorage.getItem("relationship") || "Partner";
        quality = sessionStorage.getItem("quality") || "helpful";
    });

    const handleSubmit = () => {
        sessionStorage.setItem("youSaid", youSaid);
        sessionStorage.setItem("theySaid", theySaid);
        sessionStorage.setItem("relationship", relationship);
        sessionStorage.setItem("quality", quality);
        loading = true;
    }

    let recordingYou = false;
    let loadingYou = false;
    let recordingThem = false;
    let loadingThem = false;

    let chunksYou: Blob[] = [];
    let mediaRecorderYou: MediaRecorder;

    let chunksThey: Blob[] = [];
    let mediaRecorderThem: MediaRecorder;

    const recordYou = () => {
        if (!recordingYou) {
            recordingYou = true;
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then((stream) => {
                    mediaRecorderYou = new MediaRecorder(stream);

                    mediaRecorderYou.start();

                    mediaRecorderYou.onstop = async () => {
                        stream.getTracks().forEach(track => track.stop());
                        const blob = new Blob(chunksYou, { type: "audio/ogg; codecs=opus" });
                        chunksYou = [];

                        const response = await fetch("/api/dictation", {
                            method: "POST",
                            body: blob,
                        });

                        youSaid = await response.text();
                        loadingYou = false;
                    };

                    mediaRecorderYou.ondataavailable = (e) => {
                        chunksYou.push(e.data);
                    };
                })
                .catch((err) => {
                    console.error(`The following error occurred: ${err}`);
                    recordingYou = false;
                });
        }
        else {
            mediaRecorderYou.stop();
            recordingYou = false;
            loadingYou = true;
        }
    };

    const recordThem = () => {
        if (!recordingThem) {
            recordingThem = true;
            navigator.mediaDevices
                .getUserMedia({audio: true})
                .then((stream) => {
                    mediaRecorderThem = new MediaRecorder(stream);

                    mediaRecorderThem.start();

                    mediaRecorderThem.onstop = async () => {
                        stream.getTracks().forEach(track => track.stop());
                        const blob = new Blob(chunksThey, { type: "audio/ogg; codecs=opus" });
                        chunksThey = [];

                        const response = await fetch("/api/dictation", {
                            method: "POST",
                            body: blob,
                        });

                        theySaid = await response.text();
                        loadingThem = false;
                    };

                    mediaRecorderThem.ondataavailable = (e) => {
                        chunksThey.push(e.data);
                    };
                })
                .catch((err) => {
                    console.error(`The following error occurred: ${err}`);
                    recordingThem = false;
                });
        }
        else {
            mediaRecorderThem.stop();
            recordingThem = false;
            loadingThem = true;
        }
    };
</script>

<AppBar title="💓 Empathese 💓" />

<form on:submit={handleSubmit} method="POST" action="/result" class="my-2 flex flex-col">
    <label for="yourMessage" class="font-bold">You said</label>
    <div class="join join-horizontal">
        <input name="yourMessage" type="text" class={`input input-bordered w-full mb-3 join-item`} placeholder="What did you say?" bind:value={youSaid} readonly={loading} maxlength=250 />
        {#if youSaid != ""}
            <button class="btn join-item" on:click|preventDefault={() => youSaid = ""}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>              
            </button>
        {/if}
        <button class={`btn join-item ${recordingYou ? 'btn-primary' : 'btn-neutral'}`} on:click|preventDefault={recordYou} disabled={loadingYou || recordingThem || loading}>
            {#if !recordingYou && !loadingYou}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
            {:else if !recordingYou && loadingYou}
                <span class="loading loading-dots loading-md"></span>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
            {/if}
        </button>
    </div>
    <label for="theirMessage" class="font-bold">They said</label>
    <div class="join join-horizontal">
        <input name="theirMessage" type="text" class={`input input-bordered w-full mb-3 join-item`} placeholder="What did they say?" bind:value={theySaid} readonly={loading} required maxlength=250 />
        {#if theySaid != ""}
            <button class="btn join-item" on:click|preventDefault={() => theySaid = ""}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>              
            </button>
        {/if}
        <button class={`btn join-item ${recordingThem ? 'btn-primary' : 'btn-neutral'}`} on:click|preventDefault={recordThem} disabled={loadingThem || recordingYou || loading}>
            {#if !recordingThem && !loadingThem}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
            {:else if !recordingThem && loadingThem}
                <span class="loading loading-dots loading-md"></span>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
            {/if}
        </button>
    </div>
    <div class="collapse bg-base-200 mb-6">
        <input type="checkbox" /> 
        <div class="collapse-title text-xl font-medium">
            Advanced options
        </div>
        <div class="collapse-content grid grid-cols-1 md:grid-cols-[25%_auto] gap-2 items-center">
            <label for="relationship" class="font-bold">Relationship</label>
            <select class="select w-full" name="relationship" bind:value={relationship}>
                <option selected>Partner</option>
                <option>Friend</option>
                <option>Family</option>
                <option>Acquaintance</option>
                <option>Colleague</option>
            </select>
            <label for="quality" class="font-bold">Quality</label>
            <div class="join w-full">
                <input class="join-item btn grow border-primary md:px-8" type="radio" name="quality" bind:group={quality} aria-label="Helpful" value="helpful"  checked />
                <input class="join-item btn grow border-primary md:px-8" type="radio" name="quality" bind:group={quality} aria-label="Brutal" value="brutal" />
            </div>
        </div>
      </div>
    <button type="submit" class="btn btn-block btn-primary rounded-lg" disabled={loading}>
        {#if loading}
            <span class="loading loading-dots loading-lg"></span>
        {:else}
            Submit
        {/if}
    </button>
</form>