<script lang="ts">
    import type { ActionData } from './$types';
    export let form: ActionData;
    import AppBar from "$lib/AppBar.svelte";
    import DialogueInput from "$lib/DialogueInput.svelte";
    import SuggestedResponse from "$lib/SuggestedResponse.svelte";

    let playing = "";
    let currentAudio: HTMLAudioElement | null = null;

    const speak = async (text: string) => {
        if (playing === text) {
            currentAudio?.pause();
            currentAudio = null;
            playing = "";
            return;
        }

        currentAudio?.pause();
        currentAudio = null;
        playing = text;

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                console.error('TTS request failed:', response.status, response.statusText);
                playing = "";
                return;
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            currentAudio = audio;

            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(url);
                playing = "";
                currentAudio = null;
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                playing = "";
                currentAudio = null;
            });

            await audio.play();
        } catch (err) {
            console.error('TTS error:', err);
            playing = "";
            currentAudio = null;
        }
    };
</script>

<AppBar title="✨ Results ✨" back/>

<DialogueInput disabled={true} yourMessage={form?.yourMessage} theirMessage={form?.theirMessage} />

<h2 class="text-xl text-center mt-6 mb-2 font-bold">Translation</h2>

<div class="flex items-center space-x-4">
    <p class="grow">{form?.translation}</p>

    <button on:click={() => speak(form?.translation || "")} class={`btn ${playing === form?.translation ? 'btn-error' : 'btn-neutral'}`}>
        {#if playing !== form?.translation}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
        {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
            </svg>
        {/if}
    </button>
</div>


<h2 class="text-xl text-center mt-6 mb-2 font-bold">Suggested Responses</h2>

<div class="flex flex-col gap-4">
    {#each form?.suggestions || [] as suggestion, i}
        <div class="flex items-center justify-between space-x-4">
            <SuggestedResponse index={i + 1} suggestion={suggestion} playing={playing} onspeak={() => speak(suggestion)} />
        </div>    
    {/each}
</div>
