import assert from 'assert';
import { formatBladeStringWithPint } from '../../../formatting/prettier/utils.js';
import { StringUtilities } from '../../../utilities/stringUtilities.js';
import { setupTestHooks } from '../../../test/testUtils/formatting.js';

suite('Pint Transformer Acceptance: forms_resources_views_components_builder_blade_php', () => {
    setupTestHooks();
    test('pint: it can format forms_resources_views_components_builder_blade_php', async () => {
        const input = `<x-dynamic-component
    :component="$getFieldWrapperView()"
    :id="$getId()"
    :label="$getLabel()"
    :label-sr-only="$isLabelHidden()"
    :helper-text="$getHelperText()"
    :hint="$getHint()"
    :hint-action="$getHintAction()"
    :hint-color="$getHintColor()"
    :hint-icon="$getHintIcon()"
    :required="$isRequired()"
    :state-path="$getStatePath()"
>
    @php
        $containers = $getChildComponentContainers();

        $isCloneable = $isCloneable();
        $isReorderableWithButtons = $isReorderableWithButtons();
        $isCollapsible = $isCollapsible();
        $isItemCreationDisabled = $isItemCreationDisabled();
        $isItemDeletionDisabled = $isItemDeletionDisabled();
        $isItemMovementDisabled = $isItemMovementDisabled();
    @endphp

    <div>
        @if ((count($containers) > 1) && $isCollapsible)
            <div class="space-x-2 rtl:space-x-reverse" x-data="{}">
                <x-forms::link
                    x-on:click="$dispatch('builder-collapse', '{{ $getStatePath() }}')"
                    tag="button"
                    size="sm"
                >
                    {{ __('forms::components.builder.buttons.collapse_all.label') }}
                </x-forms::link>

                <x-forms::link
                    x-on:click="$dispatch('builder-expand', '{{ $getStatePath() }}')"
                    tag="button"
                    size="sm"
                >
                    {{ __('forms::components.builder.buttons.expand_all.label') }}
                </x-forms::link>
            </div>
        @endif
    </div>

    <div {{ $attributes->merge($getExtraAttributes())->class([
        'filament-forms-builder-component space-y-6 rounded-xl',
        'bg-gray-50 p-6' => $isInset(),
        'dark:bg-gray-500/10' => $isInset() && config('forms.dark_mode'),
    ]) }}>
        @if (count($containers))
            <ul
                @class([
                    'space-y-12' => (! $isItemCreationDisabled) && (! $isItemMovementDisabled),
                    'space-y-6' => $isItemCreationDisabled || $isItemMovementDisabled,
                ])
                wire:sortable
                wire:end.stop="dispatchFormEvent('builder::moveItems', '{{ $getStatePath() }}', $event.target.sortable.toArray())"
            >
                @php
                    $hasBlockLabels = $hasBlockLabels();
                    $hasBlockNumbers = $hasBlockNumbers();
                @endphp

                @foreach ($containers as $uuid => $item)
                    <li
                        x-data="{
                            isCreateButtonVisible: false,
                            isCollapsed: @js($isCollapsed($item)),
                        }"
                        x-on:builder-collapse.window="$event.detail === '{{ $getStatePath() }}' && (isCollapsed = true)"
                        x-on:builder-expand.window="$event.detail === '{{ $getStatePath() }}' && (isCollapsed = false)"
                        x-on:click="isCreateButtonVisible = true"
                        x-on:mouseenter="isCreateButtonVisible = true"
                        x-on:click.away="isCreateButtonVisible = false"
                        x-on:mouseleave="isCreateButtonVisible = false"
                        wire:key="{{ $this->id }}.{{ $item->getStatePath() }}.{{ $field::class }}.item"
                        wire:sortable.item="{{ $uuid }}"
                        x-on:expand-concealing-component.window="
                            error = $el.querySelector('[data-validation-error]')

                            if (! error) {
                                return
                            }

                            isCollapsed = false

                            if (document.body.querySelector('[data-validation-error]') !== error) {
                                return
                            }

                            setTimeout(() => $el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' }), 200)
                        "
                        @class([
                            'filament-forms-builder-component-item bg-white border border-gray-300 shadow-sm rounded-xl relative',
                            'dark:bg-gray-800 dark:border-gray-600' => config('forms.dark_mode'),
                        ])
                    >
                        @if ((! $isItemMovementDisabled) || $hasBlockLabels || (! $isItemDeletionDisabled) || $isCollapsible || $isCloneable)
                            <header
                                @if ($isCollapsible) x-on:click.stop="isCollapsed = ! isCollapsed" @endif
                                @class([
                                    'flex items-center h-10 overflow-hidden border-b bg-gray-50 rounded-t-xl',
                                    'dark:bg-gray-800 dark:border-gray-700' => config('forms.dark_mode'),
                                    'cursor-pointer' => $isCollapsible,
                                ])
                            >
                                @unless ($isItemMovementDisabled)
                                    <button
                                        title="{{ __('forms::components.builder.buttons.move_item.label') }}"
                                        x-on:click.stop
                                        wire:sortable.handle
                                        wire:keydown.prevent.arrow-up="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                        wire:keydown.prevent.arrow-down="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                        type="button"
                                        @class([
                                            'flex items-center justify-center flex-none w-10 h-10 text-gray-400 border-r rtl:border-l rtl:border-r-0 transition outline-none hover:text-gray-500 focus:bg-gray-500/5',
                                            'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                        ])
                                    >
                                        <span class="sr-only">
                                            {{ __('forms::components.builder.buttons.move_item.label') }}
                                        </span>

                                        <x-heroicon-s-switch-vertical class="w-4 h-4"/>
                                    </button>
                                @endunless

                                @if ($hasBlockLabels)
                                    <p @class([
                                        'flex-none px-4 text-xs font-medium text-gray-600 truncate',
                                        'dark:text-gray-400' => config('forms.dark_mode'),
                                    ])>
                                        @php
                                            $block = $item->getParentComponent();

                                            $block->labelState($item->getRawState());
                                        @endphp

                                        {{ $item->getParentComponent()->getLabel() }}

                                        @php
                                            $block->labelState(null);
                                        @endphp

                                        @if ($hasBlockNumbers)
                                            <small class="font-mono">{{ $loop->iteration }}</small>
                                        @endif
                                    </p>
                                @endif

                                <div class="flex-1"></div>

                                <ul @class([
                                    'flex divide-x rtl:divide-x-reverse',
                                    'dark:divide-gray-700' => config('forms.dark_mode'),
                                ])>
                                    @if ($isReorderableWithButtons)
                                        @unless ($loop->first)
                                            <li>
                                                <button
                                                    title="{{ __('forms::components.builder.buttons.move_item_up.label') }}"
                                                    type="button"
                                                    wire:click.stop="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:target="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:loading.attr="disabled"
                                                    @class([
                                                        'flex items-center justify-center flex-none w-10 h-10 text-gray-400 transition outline-none hover:text-gray-500 focus:bg-gray-500/5',
                                                        'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                    ])
                                                >
                                                    <span class="sr-only">
                                                        {{ __('forms::components.builder.buttons.move_item_up.label') }}
                                                    </span>

                                                    <x-heroicon-s-chevron-up
                                                        class="w-4 h-4"
                                                        wire:loading.remove.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    />

                                                    <x-filament-support::loading-indicator
                                                        class="w-4 h-4 text-primary-500"
                                                        wire:loading.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                        x-cloak
                                                    />
                                                </button>
                                            </li>
                                        @endunless

                                        @unless ($loop->last)
                                            <li>
                                                <button
                                                    title="{{ __('forms::components.builder.buttons.move_item_down.label') }}"
                                                    type="button"
                                                    wire:click.stop="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:target="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:loading.attr="disabled"
                                                    @class([
                                                        'flex items-center justify-center flex-none w-10 h-10 text-gray-400 transition outline-none hover:text-gray-500 focus:bg-gray-500/5',
                                                        'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                    ])
                                                >
                                                    <span class="sr-only">
                                                        {{ __('forms::components.builder.buttons.move_item_down.label') }}
                                                    </span>

                                                    <x-heroicon-s-chevron-down
                                                        class="w-4 h-4"
                                                        wire:loading.remove.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    />

                                                    <x-filament-support::loading-indicator
                                                        class="w-4 h-4 text-primary-500"
                                                        wire:loading.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                        x-cloak
                                                    />
                                                </button>
                                            </li>
                                        @endunless
                                    @endif

                                    @if ($isCloneable)
                                        <li>
                                            <button
                                                title="{{ __('forms::components.builder.buttons.clone_item.label') }}"
                                                wire:click.stop="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:target="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:loading.attr="disabled"
                                                type="button"
                                                @class([
                                                    'flex items-center justify-center flex-none w-10 h-10 text-gray-400 transition outline-none hover:text-gray-500 focus:bg-gray-500/5',
                                                    'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                ])
                                            >
                                                <span class="sr-only">
                                                    {{ __('forms::components.builder.buttons.clone_item.label') }}
                                                </span>

                                                <x-heroicon-s-duplicate
                                                    class="w-4 h-4"
                                                    wire:loading.remove.delay
                                                    wire:target="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                />

                                                <x-filament-support::loading-indicator
                                                    class="w-4 h-4 text-primary-500"
                                                    wire:loading.delay
                                                    wire:target="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    x-cloak
                                                />
                                            </button>
                                        </li>
                                    @endif

                                    @unless ($isItemDeletionDisabled)
                                        <li>
                                            <button
                                                title="{{ __('forms::components.builder.buttons.delete_item.label') }}"
                                                wire:click.stop="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:target="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:loading.attr="disabled"
                                                type="button"
                                                @class([
                                                    'flex items-center justify-center flex-none w-10 h-10 text-danger-600 transition outline-none hover:text-danger-500 focus:bg-gray-500/5',
                                                    'dark:text-danger-500 dark:hover:text-danger-400 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                ])
                                            >
                                                <span class="sr-only">
                                                    {{ __('forms::components.builder.buttons.delete_item.label') }}
                                                </span>

                                                <x-heroicon-s-trash
                                                    class="w-4 h-4"
                                                    wire:loading.remove.delay
                                                    wire:target="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                />

                                                <x-filament-support::loading-indicator
                                                    class="w-4 h-4 text-primary-500"
                                                    wire:loading.delay
                                                    wire:target="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    x-cloak
                                                />
                                            </button>
                                        </li>
                                    @endunless

                                    @if ($isCollapsible)
                                        <li>
                                            <button
                                                x-bind:title="(! isCollapsed) ? '{{ __('forms::components.builder.buttons.collapse_item.label') }}' : '{{ __('forms::components.builder.buttons.expand_item.label') }}'"
                                                x-on:click.stop="isCollapsed = ! isCollapsed"
                                                type="button"
                                                @class([
                                                    'flex items-center justify-center flex-none w-10 h-10 text-gray-400 transition outline-none hover:text-gray-500 focus:bg-gray-500/5',
                                                    'dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                ])
                                            >
                                                <x-heroicon-s-minus-sm class="w-4 h-4" x-show="! isCollapsed"/>

                                                <span class="sr-only" x-show="! isCollapsed">
                                                    {{ __('forms::components.builder.buttons.collapse_item.label') }}
                                                </span>

                                                <x-heroicon-s-plus-sm class="w-4 h-4" x-show="isCollapsed" x-cloak/>

                                                <span class="sr-only" x-show="isCollapsed" x-cloak>
                                                    {{ __('forms::components.builder.buttons.expand_item.label') }}
                                                </span>
                                            </button>
                                        </li>
                                    @endif
                                </ul>
                            </header>
                        @endif

                        <div x-bind:class="{ 'invisible h-0 !m-0 overflow-y-hidden': isCollapsed, 'p-6': !isCollapsed}">
                            {{ $item }}
                        </div>

                        <div class="p-2 text-xs text-center text-gray-400" x-show="isCollapsed" x-cloak>
                            {{ __('forms::components.builder.collapsed') }}
                        </div>

                        @if ((! $loop->last) && (! $isItemCreationDisabled) && (! $isItemMovementDisabled))
                            <div
                                x-show="isCreateButtonVisible"
                                x-transition
                                class="absolute inset-x-0 bottom-0 flex items-center justify-center h-12 -mb-12"
                            >
                                <x-forms::builder.block-picker
                                    :blocks="$getBlocks()"
                                    :create-after-item="$uuid"
                                    :state-path="$getStatePath()"
                                >
                                    <x-slot name="trigger">
                                        <x-forms::icon-button
                                            :label="$getCreateItemBetweenButtonLabel()"
                                            icon="heroicon-o-plus"
                                        />
                                    </x-slot>
                                </x-forms::builder.block-picker>
                            </div>
                        @endif
                    </li>
                @endforeach
            </ul>
        @endif

        @if (! $isItemCreationDisabled)
            <x-forms::builder.block-picker
                :blocks="$getBlocks()"
                :state-path="$getStatePath()"
                class="flex justify-center"
            >
                <x-slot name="trigger">
                    <x-forms::button size="sm" outlined>
                        {{ $getCreateItemButtonLabel() }}
                    </x-forms::button>
                </x-slot>
            </x-forms::builder.block-picker>
        @endif
    </div>
</x-dynamic-component>
`;
        const output = `<x-dynamic-component
    :component="$getFieldWrapperView()"
    :id="$getId()"
    :label="$getLabel()"
    :label-sr-only="$isLabelHidden()"
    :helper-text="$getHelperText()"
    :hint="$getHint()"
    :hint-action="$getHintAction()"
    :hint-color="$getHintColor()"
    :hint-icon="$getHintIcon()"
    :required="$isRequired()"
    :state-path="$getStatePath()"
>
    @php
        $containers = $getChildComponentContainers();

        $isCloneable = $isCloneable();
        $isReorderableWithButtons = $isReorderableWithButtons();
        $isCollapsible = $isCollapsible();
        $isItemCreationDisabled = $isItemCreationDisabled();
        $isItemDeletionDisabled = $isItemDeletionDisabled();
        $isItemMovementDisabled = $isItemMovementDisabled();
    @endphp

    <div>
        @if ((count($containers) > 1) && $isCollapsible)
            <div class="space-x-2 rtl:space-x-reverse" x-data="{}">
                <x-forms::link
                    x-on:click="$dispatch('builder-collapse', '{{ $getStatePath() }}')"
                    tag="button"
                    size="sm"
                >
                    {{ __('forms::components.builder.buttons.collapse_all.label') }}
                </x-forms::link>

                <x-forms::link
                    x-on:click="$dispatch('builder-expand', '{{ $getStatePath() }}')"
                    tag="button"
                    size="sm"
                >
                    {{ __('forms::components.builder.buttons.expand_all.label') }}
                </x-forms::link>
            </div>
        @endif
    </div>

    <div
        {{
            $attributes->merge($getExtraAttributes())->class([
                'filament-forms-builder-component space-y-6 rounded-xl',
                'bg-gray-50 p-6' => $isInset(),
                'dark:bg-gray-500/10' => $isInset() && config('forms.dark_mode'),
            ])
        }}
    >
        @if (count($containers))
            <ul
                @class([
                    'space-y-12' => (! $isItemCreationDisabled) && (! $isItemMovementDisabled),
                    'space-y-6' => $isItemCreationDisabled || $isItemMovementDisabled,
                ])
                wire:sortable
                wire:end.stop="dispatchFormEvent('builder::moveItems', '{{ $getStatePath() }}', $event.target.sortable.toArray())"
            >
                @php
                    $hasBlockLabels = $hasBlockLabels();
                    $hasBlockNumbers = $hasBlockNumbers();
                @endphp

                @foreach ($containers as $uuid => $item)
                    <li
                        x-data="{
                            isCreateButtonVisible: false,
                            isCollapsed: @js($isCollapsed($item)),
                        }"
                        x-on:builder-collapse.window="$event.detail === '{{ $getStatePath() }}' && (isCollapsed = true)"
                        x-on:builder-expand.window="$event.detail === '{{ $getStatePath() }}' && (isCollapsed = false)"
                        x-on:click="isCreateButtonVisible = true"
                        x-on:mouseenter="isCreateButtonVisible = true"
                        x-on:click.away="isCreateButtonVisible = false"
                        x-on:mouseleave="isCreateButtonVisible = false"
                        wire:key="{{ $this->id }}.{{ $item->getStatePath() }}.{{ $field::class }}.item"
                        wire:sortable.item="{{ $uuid }}"
                        x-on:expand-concealing-component.window="
                            error = $el.querySelector('[data-validation-error]')

                            if (! error) {
                                return
                            }

                            isCollapsed = false

                            if (document.body.querySelector('[data-validation-error]') !== error) {
                                return
                            }

                            setTimeout(
                                () =>
                                    $el.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                        inline: 'start',
                                    }),
                                200,
                            )
                        "
                        @class([
                            'filament-forms-builder-component-item relative rounded-xl border border-gray-300 bg-white shadow-sm',
                            'dark:border-gray-600 dark:bg-gray-800' => config('forms.dark_mode'),
                        ])
                    >
                        @if ((! $isItemMovementDisabled) || $hasBlockLabels || (! $isItemDeletionDisabled) || $isCollapsible || $isCloneable)
                            <header
                                @if ($isCollapsible) x-on:click.stop="isCollapsed = ! isCollapsed" @endif
                                @class([
                                    'flex h-10 items-center overflow-hidden rounded-t-xl border-b bg-gray-50',
                                    'dark:border-gray-700 dark:bg-gray-800' => config('forms.dark_mode'),
                                    'cursor-pointer' => $isCollapsible,
                                ])
                            >
                                @unless ($isItemMovementDisabled)
                                    <button
                                        title="{{ __('forms::components.builder.buttons.move_item.label') }}"
                                        x-on:click.stop
                                        wire:sortable.handle
                                        wire:keydown.prevent.arrow-up="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                        wire:keydown.prevent.arrow-down="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                        type="button"
                                        @class([
                                            'flex h-10 w-10 flex-none items-center justify-center border-r text-gray-400 outline-none transition hover:text-gray-500 focus:bg-gray-500/5 rtl:border-l rtl:border-r-0',
                                            'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                        ])
                                    >
                                        <span class="sr-only">
                                            {{ __('forms::components.builder.buttons.move_item.label') }}
                                        </span>

                                        <x-heroicon-s-switch-vertical
                                            class="h-4 w-4"
                                        />
                                    </button>
                                @endunless

                                @if ($hasBlockLabels)
                                    <p
                                        @class([
                                            'flex-none truncate px-4 text-xs font-medium text-gray-600',
                                            'dark:text-gray-400' => config('forms.dark_mode'),
                                        ])
                                    >
                                        @php
                                            $block = $item->getParentComponent();

                                            $block->labelState($item->getRawState());
                                        @endphp

                                        {{ $item->getParentComponent()->getLabel() }}

                                        @php
                                            $block->labelState(null);
                                        @endphp

                                        @if ($hasBlockNumbers)
                                            <small class="font-mono">
                                                {{ $loop->iteration }}
                                            </small>
                                        @endif
                                    </p>
                                @endif

                                <div class="flex-1"></div>

                                <ul
                                    @class([
                                        'flex divide-x rtl:divide-x-reverse',
                                        'dark:divide-gray-700' => config('forms.dark_mode'),
                                    ])
                                >
                                    @if ($isReorderableWithButtons)
                                        @unless ($loop->first)
                                            <li>
                                                <button
                                                    title="{{ __('forms::components.builder.buttons.move_item_up.label') }}"
                                                    type="button"
                                                    wire:click.stop="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:target="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:loading.attr="disabled"
                                                    @class([
                                                        'flex h-10 w-10 flex-none items-center justify-center text-gray-400 outline-none transition hover:text-gray-500 focus:bg-gray-500/5',
                                                        'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                    ])
                                                >
                                                    <span class="sr-only">
                                                        {{ __('forms::components.builder.buttons.move_item_up.label') }}
                                                    </span>

                                                    <x-heroicon-s-chevron-up
                                                        class="h-4 w-4"
                                                        wire:loading.remove.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    />

                                                    <x-filament-support::loading-indicator
                                                        class="text-primary-500 h-4 w-4"
                                                        wire:loading.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemUp', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                        x-cloak
                                                    />
                                                </button>
                                            </li>
                                        @endunless

                                        @unless ($loop->last)
                                            <li>
                                                <button
                                                    title="{{ __('forms::components.builder.buttons.move_item_down.label') }}"
                                                    type="button"
                                                    wire:click.stop="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:target="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    wire:loading.attr="disabled"
                                                    @class([
                                                        'flex h-10 w-10 flex-none items-center justify-center text-gray-400 outline-none transition hover:text-gray-500 focus:bg-gray-500/5',
                                                        'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                    ])
                                                >
                                                    <span class="sr-only">
                                                        {{ __('forms::components.builder.buttons.move_item_down.label') }}
                                                    </span>

                                                    <x-heroicon-s-chevron-down
                                                        class="h-4 w-4"
                                                        wire:loading.remove.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    />

                                                    <x-filament-support::loading-indicator
                                                        class="text-primary-500 h-4 w-4"
                                                        wire:loading.delay
                                                        wire:target="dispatchFormEvent('builder::moveItemDown', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                        x-cloak
                                                    />
                                                </button>
                                            </li>
                                        @endunless
                                    @endif

                                    @if ($isCloneable)
                                        <li>
                                            <button
                                                title="{{ __('forms::components.builder.buttons.clone_item.label') }}"
                                                wire:click.stop="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:target="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:loading.attr="disabled"
                                                type="button"
                                                @class([
                                                    'flex h-10 w-10 flex-none items-center justify-center text-gray-400 outline-none transition hover:text-gray-500 focus:bg-gray-500/5',
                                                    'dark:border-gray-700 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                ])
                                            >
                                                <span class="sr-only">
                                                    {{ __('forms::components.builder.buttons.clone_item.label') }}
                                                </span>

                                                <x-heroicon-s-duplicate
                                                    class="h-4 w-4"
                                                    wire:loading.remove.delay
                                                    wire:target="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                />

                                                <x-filament-support::loading-indicator
                                                    class="text-primary-500 h-4 w-4"
                                                    wire:loading.delay
                                                    wire:target="dispatchFormEvent('builder::cloneItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    x-cloak
                                                />
                                            </button>
                                        </li>
                                    @endif

                                    @unless ($isItemDeletionDisabled)
                                        <li>
                                            <button
                                                title="{{ __('forms::components.builder.buttons.delete_item.label') }}"
                                                wire:click.stop="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:target="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                wire:loading.attr="disabled"
                                                type="button"
                                                @class([
                                                    'text-danger-600 hover:text-danger-500 flex h-10 w-10 flex-none items-center justify-center outline-none transition focus:bg-gray-500/5',
                                                    'dark:text-danger-500 dark:hover:text-danger-400 dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                ])
                                            >
                                                <span class="sr-only">
                                                    {{ __('forms::components.builder.buttons.delete_item.label') }}
                                                </span>

                                                <x-heroicon-s-trash
                                                    class="h-4 w-4"
                                                    wire:loading.remove.delay
                                                    wire:target="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                />

                                                <x-filament-support::loading-indicator
                                                    class="text-primary-500 h-4 w-4"
                                                    wire:loading.delay
                                                    wire:target="dispatchFormEvent('builder::deleteItem', '{{ $getStatePath() }}', '{{ $uuid }}')"
                                                    x-cloak
                                                />
                                            </button>
                                        </li>
                                    @endunless

                                    @if ($isCollapsible)
                                        <li>
                                            <button
                                                x-bind:title="
                                                    ! isCollapsed
                                                        ? '{{ __('forms::components.builder.buttons.collapse_item.label') }}'
                                                        : '{{ __('forms::components.builder.buttons.expand_item.label') }}'
                                                "
                                                x-on:click.stop="isCollapsed = ! isCollapsed"
                                                type="button"
                                                @class([
                                                    'flex h-10 w-10 flex-none items-center justify-center text-gray-400 outline-none transition hover:text-gray-500 focus:bg-gray-500/5',
                                                    'dark:focus:bg-gray-600/20' => config('forms.dark_mode'),
                                                ])
                                            >
                                                <x-heroicon-s-minus-sm
                                                    class="h-4 w-4"
                                                    x-show="! isCollapsed"
                                                />

                                                <span
                                                    class="sr-only"
                                                    x-show="! isCollapsed"
                                                >
                                                    {{ __('forms::components.builder.buttons.collapse_item.label') }}
                                                </span>

                                                <x-heroicon-s-plus-sm
                                                    class="h-4 w-4"
                                                    x-show="isCollapsed"
                                                    x-cloak
                                                />

                                                <span
                                                    class="sr-only"
                                                    x-show="isCollapsed"
                                                    x-cloak
                                                >
                                                    {{ __('forms::components.builder.buttons.expand_item.label') }}
                                                </span>
                                            </button>
                                        </li>
                                    @endif
                                </ul>
                            </header>
                        @endif

                        <div
                            x-bind:class="{
                                'invisible h-0 !m-0 overflow-y-hidden': isCollapsed,
                                'p-6': ! isCollapsed,
                            }"
                        >
                            {{ $item }}
                        </div>

                        <div
                            class="p-2 text-center text-xs text-gray-400"
                            x-show="isCollapsed"
                            x-cloak
                        >
                            {{ __('forms::components.builder.collapsed') }}
                        </div>

                        @if ((! $loop->last) && (! $isItemCreationDisabled) && (! $isItemMovementDisabled))
                            <div
                                x-show="isCreateButtonVisible"
                                x-transition
                                class="absolute inset-x-0 bottom-0 -mb-12 flex h-12 items-center justify-center"
                            >
                                <x-forms::builder.block-picker
                                    :blocks="$getBlocks()"
                                    :create-after-item="$uuid"
                                    :state-path="$getStatePath()"
                                >
                                    <x-slot name="trigger">
                                        <x-forms::icon-button
                                            :label="$getCreateItemBetweenButtonLabel()"
                                            icon="heroicon-o-plus"
                                        />
                                    </x-slot>
                                </x-forms::builder.block-picker>
                            </div>
                        @endif
                    </li>
                @endforeach
            </ul>
        @endif

        @if (! $isItemCreationDisabled)
            <x-forms::builder.block-picker
                :blocks="$getBlocks()"
                :state-path="$getStatePath()"
                class="flex justify-center"
            >
                <x-slot name="trigger">
                    <x-forms::button size="sm" outlined>
                        {{ $getCreateItemButtonLabel() }}
                    </x-forms::button>
                </x-slot>
            </x-forms::builder.block-picker>
        @endif
    </div>
</x-dynamic-component>
`;

        assert.strictEqual(StringUtilities.normalizeLineEndings((await formatBladeStringWithPint(input)).trim()), StringUtilities.normalizeLineEndings(output.trim()));
        assert.strictEqual(StringUtilities.normalizeLineEndings((await formatBladeStringWithPint(output)).trim()), StringUtilities.normalizeLineEndings(output.trim()));
    }).timeout(30000);
});