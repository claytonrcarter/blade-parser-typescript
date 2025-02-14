import assert from 'assert';
import { formatBladeStringWithPint } from '../../../formatting/prettier/utils.js';
import { StringUtilities } from '../../../utilities/stringUtilities.js';
import { setupTestHooks } from '../../../test/testUtils/formatting.js';

suite('Pint Transformer Acceptance: forms_resources_views_components_tags_input_blade_php', () => {
    setupTestHooks();
    test('pint: it can format forms_resources_views_components_tags_input_blade_php', async () => {
        const input = `<x-dynamic-component
    :component="$getFieldWrapperView()"
    :id="$getId()"
    :label="$getLabel()"
    :label-sr-only="$isLabelHidden()"
    has-nested-recursive-validation-rules
    :helper-text="$getHelperText()"
    :hint="$getHint()"
    :hint-action="$getHintAction()"
    :hint-color="$getHintColor()"
    :hint-icon="$getHintIcon()"
    :required="$isRequired()"
    :state-path="$getStatePath()"
>
    <div
        x-data="tagsInputFormComponent({
            state: $wire.{{ $applyStateBindingModifiers('entangle(\\'' . $getStatePath() . '\\')') }},
        })"
        id="{{ $getId() }}"
        {{ $attributes->merge($getExtraAttributes())->class(['filament-forms-tags-input-component']) }}
        {{ $getExtraAlpineAttributeBag() }}
    >
        <div
            x-show="state.length || {{ $isDisabled() ? 'false' : 'true' }}"
            @class([
                'block w-full transition duration-75 divide-y rounded-lg shadow-sm border overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
                'dark:divide-gray-600' => config('forms.dark_mode'),
                'border-gray-300' => ! $errors->has($getStatePath()),
                'dark:border-gray-600' => (! $errors->has($getStatePath())) && config('forms.dark_mode'),
                'border-danger-600 ring-1 ring-inset ring-danger-600' => $errors->has($getStatePath()),
                'dark:border-danger-400 dark:ring-danger-400' => $errors->has($getStatePath()) && config('forms.dark_mode'),
            ])
        >
            @unless ($isDisabled())
                <div>
                    <input
                        autocomplete="off"
                        {!! $isAutofocused() ? 'autofocus' : null !!}
                        id="{{ $getId() }}"
                        list="{{ $getId() }}-suggestions"
                        {!! $getPlaceholder() ? 'placeholder="' . $getPlaceholder() . '"' : null !!}
                        type="text"
                        dusk="filament.forms.{{ $getStatePath() }}"
                        x-on:keydown.enter.stop.prevent="createTag()"
                        x-on:keydown.,.stop.prevent="createTag()"
                        x-on:blur="createTag()"
                        x-on:paste="$nextTick(() => {
                            if (newTag.includes(',')) {
                                newTag.split(',').forEach((tag) => {
                                    newTag = tag

                                    createTag()
                                })
                            }
                        })"
                        x-model="newTag"
                        {{ $getExtraInputAttributeBag()->class([
                            'webkit-calendar-picker-indicator:opacity-0 block w-full border-0',
                            'dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400' => config('forms.dark_mode'),
                        ]) }}
                    />

                    <datalist id="{{ $getId() }}-suggestions">
                        @foreach ($getSuggestions() as $suggestion)
                            <template x-if="! state.includes(@js($suggestion))" x-bind:key="@js($suggestion)">
                                <option value="{{ $suggestion }}" />
                            </template>
                        @endforeach
                    </datalist>
                </div>
            @endunless

            <div
                x-show="state.length"
                x-cloak
                class="relative w-full p-2 overflow-hidden"
            >
                <div class="flex flex-wrap gap-1">
                    <template class="hidden" x-for="tag in state" x-bind:key="tag">
                        <button
                            @unless ($isDisabled())
                                x-on:click="deleteTag(tag)"
                            @endunless
                            type="button"
                            x-bind:dusk="'filament.forms.{{ $getStatePath() }}' + '.tag.' + tag + '.delete'"
                            @class([
                                'inline-flex items-center justify-center min-h-6 px-2 py-0.5 text-sm font-medium tracking-tight text-primary-700 rounded-xl bg-primary-500/10 space-x-1 rtl:space-x-reverse',
                                'dark:text-primary-500' => config('forms.dark_mode'),
                                'cursor-default' => $isDisabled(),
                            ])
                        >
                            <span class="text-start" x-text="tag"></span>

                            @unless ($isDisabled())
                                <x-heroicon-s-x class="w-3 h-3 shrink-0" />
                            @endunless
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</x-dynamic-component>
`;
        const output = `<x-dynamic-component
    :component="$getFieldWrapperView()"
    :id="$getId()"
    :label="$getLabel()"
    :label-sr-only="$isLabelHidden()"
    has-nested-recursive-validation-rules
    :helper-text="$getHelperText()"
    :hint="$getHint()"
    :hint-action="$getHintAction()"
    :hint-color="$getHintColor()"
    :hint-icon="$getHintIcon()"
    :required="$isRequired()"
    :state-path="$getStatePath()"
>
    <div
        x-data="tagsInputFormComponent({
                    state: $wire.{{ $applyStateBindingModifiers('entangle(\\''.$getStatePath().'\\')') }},
                })"
        id="{{ $getId() }}"
        {{ $attributes->merge($getExtraAttributes())->class(['filament-forms-tags-input-component']) }}
        {{ $getExtraAlpineAttributeBag() }}
    >
        <div
            x-show="state.length || {{ $isDisabled() ? 'false' : 'true' }}"
            @class([
                'focus-within:border-primary-500 focus-within:ring-primary-500 block w-full divide-y overflow-hidden rounded-lg border shadow-sm transition duration-75 focus-within:ring-1',
                'dark:divide-gray-600' => config('forms.dark_mode'),
                'border-gray-300' => ! $errors->has($getStatePath()),
                'dark:border-gray-600' => (! $errors->has($getStatePath())) && config('forms.dark_mode'),
                'border-danger-600 ring-danger-600 ring-1 ring-inset' => $errors->has($getStatePath()),
                'dark:border-danger-400 dark:ring-danger-400' => $errors->has($getStatePath()) && config('forms.dark_mode'),
            ])
        >
            @unless ($isDisabled())
                <div>
                    <input
                        autocomplete="off"
                        {!! $isAutofocused() ? 'autofocus' : null !!}
                        id="{{ $getId() }}"
                        list="{{ $getId() }}-suggestions"
                        {!! $getPlaceholder() ? 'placeholder="'.$getPlaceholder().'"' : null !!}
                        type="text"
                        dusk="filament.forms.{{ $getStatePath() }}"
                        x-on:keydown.enter.stop.prevent="createTag()"
                        x-on:keydown.,.stop.prevent="createTag()"
                        x-on:blur="createTag()"
                        x-on:paste="
                            $nextTick(() => {
                                if (newTag.includes(',')) {
                                    newTag.split(',').forEach((tag) => {
                                        newTag = tag

                                        createTag()
                                    })
                                }
                            })
                        "
                        x-model="newTag"
                        {{
                            $getExtraInputAttributeBag()->class([
                                'webkit-calendar-picker-indicator:opacity-0 block w-full border-0',
                                'dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400' => config('forms.dark_mode'),
                            ])
                        }}
                    />

                    <datalist id="{{ $getId() }}-suggestions">
                        @foreach ($getSuggestions() as $suggestion)
                            <template
                                x-if="! state.includes(@js($suggestion))"
                                x-bind:key="@js($suggestion)"
                            >
                                <option value="{{ $suggestion }}" />
                            </template>
                        @endforeach
                    </datalist>
                </div>
            @endunless

            <div
                x-show="state.length"
                x-cloak
                class="relative w-full overflow-hidden p-2"
            >
                <div class="flex flex-wrap gap-1">
                    <template
                        class="hidden"
                        x-for="tag in state"
                        x-bind:key="tag"
                    >
                        <button
                            @unless ($isDisabled())
                                x-on:click="deleteTag(tag)"
                            @endunless
                            type="button"
                            x-bind:dusk="'filament.forms.{{ $getStatePath() }}' + '.tag.' + tag + '.delete'"
                            @class([
                                'min-h-6 text-primary-700 bg-primary-500/10 inline-flex items-center justify-center space-x-1 rounded-xl px-2 py-0.5 text-sm font-medium tracking-tight rtl:space-x-reverse',
                                'dark:text-primary-500' => config('forms.dark_mode'),
                                'cursor-default' => $isDisabled(),
                            ])
                        >
                            <span class="text-start" x-text="tag"></span>

                            @unless ($isDisabled())
                                <x-heroicon-s-x class="h-3 w-3 shrink-0" />
                            @endunless
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>
</x-dynamic-component>
`;

        assert.strictEqual(StringUtilities.normalizeLineEndings((await formatBladeStringWithPint(input)).trim()), StringUtilities.normalizeLineEndings(output.trim()));
        assert.strictEqual(StringUtilities.normalizeLineEndings((await formatBladeStringWithPint(output)).trim()), StringUtilities.normalizeLineEndings(output.trim()));
    }).timeout(30000);
});