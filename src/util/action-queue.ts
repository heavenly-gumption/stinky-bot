export type ActionToPerform<T, V> = [T, V]
export type ActionQueue<T, V> = ActionToPerform<T, V>[]

export const updateActionQueue = <T, V>(action: ActionToPerform<T, V>, queue: ActionQueue<T, V>
    ): ActionToPerform<T, V> | undefined => {
    queue.push(action)
    return queue.shift()
}