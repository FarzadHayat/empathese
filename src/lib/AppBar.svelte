<script lang="ts">
    export let title: string;
    export let back = false;
</script>

<header class="flex flex-row">
    {#if back}
        <a class="btn btn-sm btn-primary" aria-label="Back" href="/">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </a>
    {/if}
    <h1 class="text-2xl text-center mb-2 font-bold grow">{title}</h1>
</header>

<style>
    header {
        font-family: 'Gluten', cursive;
    }
</style>