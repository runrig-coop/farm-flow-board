<script setup lang="ts">
import { inject, ref } from 'vue'
import { Menubar } from 'radix-vue/namespaced'
import IconChevronRight from '@/assets/radix-icons/chevron-right.svg?component';
import IconCheck from '@/assets/radix-icons/check.svg?component';
import IconDotFilled from '@/assets/radix-icons/dot-filled.svg?component';
import { boardIdKey } from '@/data/providerKeys';

const currentMenu = ref('')
const checkboxOne = ref(false)
const checkboxTwo = ref(false)
const boardId = inject<'2023'|'random'>(boardIdKey);
const boardRadio = ref<'2023'|'random'|undefined>(boardId);
const emit = defineEmits(['select-board']);
function handleSelectBoard(e: any) {
  if (typeof e === 'string') {
    emit('select-board', e);
  }
}
</script>

<template>
  <Menubar.Root v-model="currentMenu" class="MenubarRoot">
    <Menubar.Menu value="Board">
      <Menubar.Trigger
        class="MenubarTrigger">
        Board
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-3">
          <Menubar.Item class="MenubarItem">
            New Board
            <div class="RightSlot">
              ⌘ N
            </div>
          </Menubar.Item>

          <Menubar.Item class="MenubarItem">
            Duplicate
          </Menubar.Item>

          <Menubar.Item class="MenubarItem">
            Import Data
          </Menubar.Item>

          <Menubar.Item class="MenubarItem">
            Export Data
          </Menubar.Item>

          <Menubar.Separator class="MenubarSeparator" />

          <Menubar.Sub>
            <Menubar.SubTrigger class="MenubarItem">
              Recent
              <div class="RightSlot">
                <IconChevronRight />
              </div>
            </Menubar.SubTrigger>

            <Menubar.Portal>
              <Menubar.SubContent
                class="MenubarContent"
                :align-offset="-5">
                <Menubar.RadioGroup
                  v-model="boardRadio"
                  @update:model-value="handleSelectBoard">

                  <Menubar.RadioItem
                    class="MenubarCheckboxItem inset"
                    value="2023">
                    <Menubar.ItemIndicator class="MenubarItemIndicator">
                      <IconDotFilled />
                    </Menubar.ItemIndicator>
                    2023 Crops
                  </Menubar.RadioItem>

                  <Menubar.RadioItem
                    class="MenubarCheckboxItem inset"
                    value="random">
                    <Menubar.ItemIndicator class="MenubarItemIndicator">
                      <IconDotFilled />
                    </Menubar.ItemIndicator>
                    Random
                  </Menubar.RadioItem>

                </Menubar.RadioGroup>
              </Menubar.SubContent>
            </Menubar.Portal>
          </Menubar.Sub>

          <Menubar.Separator class="MenubarSeparator" />

          <Menubar.Item class="MenubarItem">
            Edit Board Info
          </Menubar.Item>

          <Menubar.Item class="MenubarItem">
            Preferences
          </Menubar.Item>

          <Menubar.Item class="MenubarItem">
            Reports
          </Menubar.Item>

        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

    <Menubar.Menu>
      <Menubar.Trigger class="MenubarTrigger">
        Locations
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-3">
          <Menubar.Item class="MenubarItem">
            Sort
          </Menubar.Item>
          <Menubar.Item class="MenubarItem">
            Filter
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

    <Menubar.Menu>
      <Menubar.Trigger class="MenubarTrigger">
        Timeline
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-14">
          <Menubar.CheckboxItem
            v-model:checked="checkboxOne"
            class="MenubarCheckboxItem inset">
            <Menubar.ItemIndicator class="MenubarItemIndicator">
              <IconCheck />
            </Menubar.ItemIndicator>
            Show Months
          </Menubar.CheckboxItem>
          <Menubar.CheckboxItem
            v-model:checked="checkboxTwo"
            class="MenubarCheckboxItem inset">
            <Menubar.ItemIndicator class="MenubarItemIndicator">
              <IconCheck />
            </Menubar.ItemIndicator>
            Show Rainfall
          </Menubar.CheckboxItem>
          <Menubar.Separator class="MenubarSeparator" />
          <Menubar.Item class="MenubarItem inset">
            Jump to date...
            <div class="RightSlot">
              ⌘ J
            </div>
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>

    <Menubar.Menu>
      <Menubar.Trigger class="MenubarTrigger">
        Tasks
      </Menubar.Trigger>
      <Menubar.Portal>
        <Menubar.Content
          class="MenubarContent"
          :align="'start'"
          :side-offset="5"
          :align-offset="-14">
          <Menubar.Item class="MenubarItem">
            New Task
            <div class="RightSlot">
              ⌘ T
            </div>
          </Menubar.Item>
          <Menubar.Separator class="MenubarSeparator" />
          <Menubar.Item class="MenubarItem">
            Organize Task Categories
          </Menubar.Item>
          <Menubar.Item class="MenubarItem">
            Standard Operating Procedures
          </Menubar.Item>
        </Menubar.Content>
      </Menubar.Portal>
    </Menubar.Menu>
  </Menubar.Root>
</template>

<style scoped>
/* reset */
button {
  all: unset;
}

.MenubarRoot {
  display: flex;
  background-color: var(--color-background-soft);
  padding: 3px;
  border-radius: 6px;
  box-shadow: 0 2px 10px var(--ff-c-black-transparent-1);
}

:deep(.MenubarTrigger) {
  padding: 8px 12px;
  outline: none;
  user-select: none;
  font-weight: 500;
  line-height: 1.5;
  border-radius: 4px;
  color: var(--ff-c-green);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
}

:deep(.MenubarTrigger)[data-highlighted],
:deep(.MenubarTrigger)[data-state='open'] {
  background-color: var(--ff-c-green-transparent);
}

:deep(.MenubarContent),
:deep(.MenubarSubContent) {
  min-width: 220px;
  background-color: var(--color-background-soft);
  border-radius: 6px;
  padding: 5px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

:deep(.MenubarItem),
:deep(.MenubarSubTrigger),
:deep(.MenubarCheckboxItem),
:deep(.MenubarRadioItem) {
  all: unset;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ff-c-green);
  border-radius: 4px;
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  position: relative;
  user-select: none;
}

:deep(.MenubarItem).inset,
:deep(.MenubarSubTrigger).inset,
:deep(.MenubarCheckboxItem).inset,
:deep(.MenubarRadioItem).inset {
  padding-left: 20px;
}

:deep(.MenubarItem)[data-state='open'],
:deep(.MenubarSubTrigger)[data-state='open'] {
  background-color: var(--ff-c-green-transparent);
  color: var(--ff-c-green);
}

:deep(.MenubarItem)[data-highlighted],
:deep(.MenubarSubTrigger)[data-highlighted],
:deep(.MenubarCheckboxItem)[data-highlighted],
:deep(.MenubarRadioItem)[data-highlighted] {
  background-color: var(--ff-c-green-transparent);
  color: white;
}

:deep(.MenubarItem)[data-disabled],
:deep(.MenubarSubTrigger)[data-disabled],
:deep(.MenubarCheckboxItem)[data-disabled],
:deep(.MenubarRadioItem)[data-disabled] {
  color: var(--mauve-8);
  pointer-events: none;
}

:deep(.MenubarItemIndicator) {
  position: absolute;
  left: 0;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.MenubarSeparator) {
  height: 1px;
  background-color: var(--grass-6);
  margin: 5px;
}

:deep(.RightSlot) {
  margin-left: auto;
  padding-left: 20px;
  color: var(--mauve-9);
}

[data-highlighted] > :deep(.RightSlot) {
  color: white;
}

[data-disabled] > :deep(.RightSlot) {
  color: var(--mauve-8);
}
</style>