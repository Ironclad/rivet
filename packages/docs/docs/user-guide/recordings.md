# Recordings

Using the `ExecutionRecorder` class in your code, you can generate `.rivet-recording` files that contain
recorded executions of a rivet graph and all its subgraphs.

This documentation is about using `rivet-recording` files to replay your recordings. For information on how to
generate recordings, see the [recording API documentation](../api-reference/recording.md).

## Loading a Recording

Once you have a `rivet-recording` file, you can load it into Rivet using the `Load Recording` option in the action bar dropdown,
or by pressing `Cmd/Ctrl + Shift + O` and selecting the file.

When loaded, the border of Rivet will turn yellow, and an "Unload Recording" option will appear in the action bar.

## Playing a Recording

When a recording is loaded, the Play button turns into a "Play Recording" button. Pressing this button will play the recording.

A recording will play back [Chat Node](../node-reference/chat.mdx) that happened during the execution at a fixed rate. This rate is configurable in the
"General" area of the Rivet settings panel.

Intermediate nodes between Chat nodes will be replayed instantly.

During playback, you can press the `Pause` button in the action bar to pause the recording where it currently is. Pressing `Resume` will resume the recording from this point.

If a recording is aborted, you can click `Play Recording` again to restart it from the beginning.

To unload the recording and return to normal execution, click the `Unload Recording` button in the action bar.
