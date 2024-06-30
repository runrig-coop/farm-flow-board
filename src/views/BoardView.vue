<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { Switch } from 'radix-vue/namespaced';
import { mergeRight, omit, pick } from 'ramda';
import {
  boardIndexKey, boardsKey, cropsKey, dateRangeKey, dateSequenceKey, isDarkKey,
  locationsKey, operationsKey, plantsKey, tasksKey,
} from '@/components/providerKeys';
import type { DeleteValue, UpdateValue } from '@/components/providerKeys';
import { boardInfoRandom, generateEntities } from '@/data/random';
import {
  boardInfo2023, crops2023, deserialize, locations2023, operations2023,
  plants2023, serialize, tasks2023,
} from '@/data/deserialize';
import type { BoardData } from '@/data/deserialize';
import { Asset, Plan } from '@/data/resources';
import type {
  BoardInfo, CropTerm, LocationResource, LogResource,
  OperationTerm, PlantResource,
} from '@/data/resources';
import FlowBoard from '@/components/FlowBoard.vue';
import FlowBoardOperations from '@/components/FlowBoardOperations.vue';
import FlowBoardMenubar from '@/components/FlowBoardMenubar.vue';
import { createDateSequence } from '@/utils/date';
import LogoType from '@/assets/logotype_color.svg?component';
import IconSun from '@/assets/radix-icons/sun.svg?component'
import IconMoon from '@/assets/radix-icons/moon.svg?component'

const boards = ref<BoardInfo[]>([
  boardInfo2023,
  boardInfoRandom,
]);
const boardIndex = ref<number>(0);
const boardInfo = computed(() => boards.value[boardIndex.value]);

// All of the core data entities.
const tasks = ref<LogResource[]>(tasks2023);
const locations = ref<LocationResource[]>(locations2023);
const plants = ref<PlantResource[]>(plants2023);
const operations = ref<OperationTerm[]>(operations2023);
const crops = ref<CropTerm[]>(crops2023);

function onBoardUpdate(value: UpdateValue): void {
  let collection: Ref<UpdateValue[]>|false = false;
  if (value.type?.startsWith('log')) collection = tasks;
  else if (value.type === Asset.Plant) collection = plants;
  else if (value.type === Plan.FarmFlow) collection = boards;

  if (collection) {
    const i = collection.value.findIndex(item => item.id === value.id);
    type T = typeof collection.value[number];
    type K = keyof T;
    if (i >= 0) {
      const keys = Object.keys(collection.value[i]) as K[];
      const valid = pick(keys, value);
      const mutable = omit(['id', 'type'], valid);
      collection.value[i] = mergeRight(collection.value[i], mutable) as T;
    } else {
      (collection.value as T[]).push(value as T);
    }
  }
}
function onDelete(idfier: DeleteValue) {
  const i = tasks.value.findIndex(t => t.id === idfier.id && t.type === idfier.type);
  if (i >= 0) tasks.value.splice(i, 1);
}

// Start & end dates used to populate the x-axis & limit selection in date picker.
const dateRange = computed<[Date, Date]>(() => boardInfo.value.dateRange);
// Array of Date objects for every date within the specified range.
const dateSeq = computed<Date[]>(() =>
  createDateSequence(dateRange.value[0], dateRange.value[1]));

// Mock retrieving the task & plant entities from a database, API, file, etc.
function loadEntities(): void {
  const info = boards.value[boardIndex.value];
  if (info.id === boardInfo2023.id) {
    crops.value = crops2023;
    locations.value = locations2023;
    operations.value = operations2023;
    tasks.value = tasks2023;
    plants.value = plants2023;
  }
  else if (info.id === boardInfoRandom.id) {
    // Generate a random scatter of tasks for the grid.
    const frequency = 6; // coefficient to adjust total tasks below
    const count = frequency * Math.floor(
      // Correlate total # of tasks to the 2 main parameters, fields & dates.
      Math.sqrt(locations.value.length * dateSeq.value.length)
    );
    const random = generateEntities(
      count,
      locations.value,
      operations.value,
      crops.value,
      [boardInfoRandom.dateRange[0], boardInfoRandom.dateRange[1]],
    );
    crops.value = crops2023;
    locations.value = locations2023;
    operations.value = operations2023;
    tasks.value = random[0];
    plants.value = random[1];
  }
  else if (info.id in sessionStorage && typeof sessionStorage[info.id] === 'string') {
    const data = deserialize(sessionStorage[info.id]);
    // const data = deserialize(json);
    crops.value = data.crops;
    locations.value = data.locations;
    operations.value = data.operations;
    tasks.value = data.tasks;
    plants.value = data.plants;
  }
}

function importBoard(data: BoardData) {
  const json = serialize(data);
  sessionStorage.setItem(data.board.id, json);
  boardIndex.value = boards.value.push(data.board) - 1;
}

function exportBoard() {
  const data = {
    board: boards.value[boardIndex.value],
    crops: crops.value,
    locations: locations.value,
    operations: operations.value,
    tasks: tasks.value,
    plants: plants.value,
  };
  const json = serialize(data, null, 2);
  const blob = new Blob([json], { type: 'text/json' });
  const link = document.createElement('a');

  link.download = data.board.name.toLowerCase().replaceAll(/\s+/g, '_') + '.json';
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

  const evt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove();
}

watch(boardIndex, (i: number, prevI: number|undefined) => {
  if (prevI === undefined || i !== prevI) loadEntities();
}, { immediate: true });

const isDark = useDark({
  selector: 'body',
  attribute: 'color-scheme',
  valueDark: 'dark',
  valueLight: 'light',
});
const toggleDark = useToggle(isDark);

provide(tasksKey, tasks);
provide(locationsKey, locations);
provide(plantsKey, plants);
provide(dateSequenceKey, dateSeq);
provide(dateRangeKey, dateRange);
provide(operationsKey, operations);
provide(cropsKey, crops);
provide(boardIndexKey, boardIndex);
provide(boardsKey, boards);
provide(isDarkKey, isDark);

</script>

<template>
  <div class="layout">
    <header>
      <div class="logotype">
        <LogoType/>
      </div>
      <h1>{{ boardInfo.name }}</h1>
      <div class="menubar">
        <FlowBoardMenubar
          @select-board="boardIndex = $event"
          @export-board="exportBoard"
          @import-board="importBoard"
          @create-task="onBoardUpdate"
          @update-board-info="onBoardUpdate" />
      </div>
      <div class="dark-mode-toggle">
        <Switch.Root
          :checked="isDark"
          @update:checked="toggleDark"
          class="switch-root">
          <Switch.Thumb class="switch-thumb">
            <IconMoon v-if="isDark"/>
            <IconSun v-else />
          </Switch.Thumb>
        </Switch.Root>
      </div>
    </header>
    <main>
      <FlowBoard @update="onBoardUpdate" @delete="onDelete"/>
    </main>
    <footer>
      <FlowBoardOperations/>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100%;
}

header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 1.5;
  height: 5.5rem;
}

.logotype {
  flex: 0 0 calc(240px + 3rem);
  padding-top: .375rem;
  text-align: center;
}

.logotype svg {
  height: 3.75rem;
}

h1 {
  margin-right: 1.5rem;
}

.dark-mode-toggle {
  margin-left: auto;
  margin-right: 4rem;
  vertical-align: middle;
}
:deep(.dark-mode-toggle svg) {
  stroke: var(--color-text);
  fill: var(--color-text);
  width: 10px;
  height: 10px;
}
:deep(button) {
  all: unset;
}
:deep(.switch-root) {
  width: 42px;
  height: 25px;
  text-align: center;
  background-color: var(--color-background-soft);
  border: 2px solid var(--color-background-mute);
  border-radius: 9999px;
  position: relative;
  transition: background-color 250ms;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
:deep(.switch-root):focus {
  box-shadow: 0 0 0 2px var(--color-box-shadow-3);
}
:deep(.switch-root)[data-state='checked'] {
  background-color: var(--color-background);
}

:deep(.switch-thumb) {
  display: block;
  width: 21px;
  height: 21px;
  background-color: var(--color-background-mute);
  border-radius: 9999px;
  box-shadow: 0 2px 2px var(--color-box-shadow-1);
  transition: transform 250ms;
  transform: translateX(2px);
}
:deep(.switch-thumb)[data-state='checked'] {
  transform: translateX(19px);
}

main {
  flex: 4 1 calc(100vh - 12rem);
  width: 100%;
  padding: 0 3rem;
}

footer {
  flex: 1 1 6rem;
}
</style>