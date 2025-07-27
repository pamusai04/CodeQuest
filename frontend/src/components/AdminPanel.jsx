import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router-dom';

const problemSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
    visibleTestCases: z.array(
        z.object({
            input: z.string().min(1, 'Input is required'),
            output: z.string().min(1, 'Output is required'),
            explanation: z.string().min(1, 'Explanation is required')
        })
    ).min(1, 'At least one visible test case required'),
    hiddenTestCases: z.array(
        z.object({
            input: z.string().min(1, 'Input is required'),
            output: z.string().min(1, 'Output is required')
        })
    ).min(1, 'At least one hidden test case required'),
    startCode: z.array(
        z.object({
            language: z.enum(['cpp', 'java', 'javascript']),
            initialCode: z.string().min(1, 'Initial code is required')
        })
    ).length(3, 'All three languages required'),
    referenceSolution: z.array(
        z.object({
            language: z.enum(['cpp', 'java', 'javascript']),
            completeCode: z.string().min(1, 'Complete code is required')
        })
    ).length(3, 'All three languages required')
});

function AdminPanel() {
    const navigate = useNavigate();
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(problemSchema),
        defaultValues: {
            startCode: [
                { language: 'cpp', initialCode: '' },
                { language: 'java', initialCode: '' },
                { language: 'javascript', initialCode: '' }
            ],
            referenceSolution: [
                { language: 'cpp', completeCode: '' },
                { language: 'java', completeCode: '' },
                { language: 'javascript', completeCode: '' }
            ]
        }
    });

    const {
        fields: visibleFields,
        append: appendVisible,
        remove: removeVisible
    } = useFieldArray({
        control,
        name: 'visibleTestCases'
    });

    const {
        fields: hiddenFields,
        append: appendHidden,
        remove: removeHidden
    } = useFieldArray({
        control,
        name: 'hiddenTestCases'
    });

    const onSubmit = async (data) => {
        try {
            await axiosClient.post('/problem/create', data);
            alert('Problem created successfully!');
            navigate('/admin');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create problem');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Create New Problem</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="card bg-base-100 shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Title</span>
                            </label>
                            <input
                                {...register('title')}
                                className={`input input-bordered ${errors.title && 'input-error'}`}
                            />
                            {errors.title && (
                                <span className="text-error">{errors.title.message}</span>
                            )}
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea
                                {...register('description')}
                                className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`}
                            />
                            {errors.description && (
                                <span className="text-error">{errors.description.message}</span>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <div className="form-control w-1/2">
                                <label className="label">
                                    <span className="label-text">Difficulty</span>
                                </label>
                                <select
                                    {...register('difficulty')}
                                    className={`select select-bordered ${errors.difficulty && 'select-error'}`}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="form-control w-1/2">
                                <label className="label">
                                    <span className="label-text">Tag</span>
                                </label>
                                <select
                                    {...register('tags')}
                                    className={`select select-bordered ${errors.tags && 'select-error'}`}
                                >
                                    <option value="array">Array</option>
                                    <option value="linkedList">Linked List</option>
                                    <option value="graph">Graph</option>
                                    <option value="dp">DP</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Visible Test Cases</h3>
                            <button
                                type="button"
                                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                                className="btn btn-sm btn-primary"
                            >
                                Add Visible Case
                            </button>
                        </div>
                        {visibleFields.map((field, index) => (
                            <div key={field.id} className="border p-4 rounded-lg space-y-2">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeVisible(index)}
                                        className="btn btn-xs btn-error"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <input
                                    {...register(`visibleTestCases.${index}.input`)}
                                    placeholder="Input"
                                    className="input input-bordered w-full"
                                />
                                {errors.visibleTestCases?.[index]?.input && (
                                    <span className="text-error">{errors.visibleTestCases[index].input.message}</span>
                                )}
                                <input
                                    {...register(`visibleTestCases.${index}.output`)}
                                    placeholder="Output"
                                    className="input input-bordered w-full"
                                />
                                {errors.visibleTestCases?.[index]?.output && (
                                    <span className="text-error">{errors.visibleTestCases[index].output.message}</span>
                                )}
                                <textarea
                                    {...register(`visibleTestCases.${index}.explanation`)}
                                    placeholder="Explanation"
                                    className="textarea textarea-bordered w-full"
                                />
                                {errors.visibleTestCases?.[index]?.explanation && (
                                    <span className="text-error">{errors.visibleTestCases[index].explanation.message}</span>
                                )}
                            </div>
                        ))}
                        {errors.visibleTestCases && (
                            <span className="text-error">{errors.visibleTestCases.message}</span>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Hidden Test Cases</h3>
                            <button
                                type="button"
                                onClick={() => appendHidden({ input: '', output: '' })}
                                className="btn btn-sm btn-primary"
                            >
                                Add Hidden Case
                            </button>
                        </div>
                        {hiddenFields.map((field, index) => (
                            <div key={field.id} className="border p-4 rounded-lg space-y-2">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeHidden(index)}
                                        className="btn btn-xs btn-error"
                                    >
                                        Remove
                                    </button>
                                </div>
                                <input
                                    {...register(`hiddenTestCases.${index}.input`)}
                                    placeholder="Input"
                                    className="input input-bordered w-full"
                                />
                                {errors.hiddenTestCases?.[index]?.input && (
                                    <span className="text-error">{errors.hiddenTestCases[index].input.message}</span>
                                )}
                                <input
                                    {...register(`hiddenTestCases.${index}.output`)}
                                    placeholder="Output"
                                    className="input input-bordered w-full"
                                />
                                {errors.hiddenTestCases?.[index]?.output && (
                                    <span className="text-error">{errors.hiddenTestCases[index].output.message}</span>
                                )}
                            </div>
                        ))}
                        {errors.hiddenTestCases && (
                            <span className="text-error">{errors.hiddenTestCases.message}</span>
                        )}
                    </div>
                </div>
                <div className="card bg-base-100 shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
                    <div className="space-y-6">
                        {['cpp', 'java', 'javascript'].map((lang, index) => (
                            <div key={index} className="space-y-2">
                                <h3 className="font-medium">{lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : 'JavaScript'}</h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Initial Code</span>
                                    </label>
                                    <pre className="bg-base-300 p-4 rounded-lg">
                                        <textarea
                                            {...register(`startCode.${index}.initialCode`)}
                                            className="w-full bg-transparent font-mono"
                                            rows={6}
                                        />
                                    </pre>
                                    {errors.startCode?.[index]?.initialCode && (
                                        <span className="text-error">{errors.startCode[index].initialCode.message}</span>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Reference Solution</span>
                                    </label>
                                    <pre className="bg-base-300 p-4 rounded-lg">
                                        <textarea
                                            {...register(`referenceSolution.${index}.completeCode`)}
                                            className="w-full bg-transparent font-mono"
                                            rows={6}
                                        />
                                    </pre>
                                    {errors.referenceSolution?.[index]?.completeCode && (
                                        <span className="text-error">{errors.referenceSolution[index].completeCode.message}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating...' : 'Create Problem'}
                </button>
            </form>
        </div>
    );
}

export default AdminPanel;