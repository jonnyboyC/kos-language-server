module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter.js ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
// Public: Adapts workspace/applyEdit commands to editors.
class ApplyEditAdapter {
    // Public: Attach to a {LanguageClientConnection} to receive edit events.
    static attach(connection) {
        connection.onApplyEdit((m) => ApplyEditAdapter.onApplyEdit(m));
    }
    /**
     * Tries to apply edits and reverts if anything goes wrong.
     * Returns the checkpoint, so the caller can revert changes if needed.
     */
    static applyEdits(buffer, edits) {
        const checkpoint = buffer.createCheckpoint();
        try {
            // Sort edits in reverse order to prevent edit conflicts.
            edits.sort((edit1, edit2) => -edit1.oldRange.compare(edit2.oldRange));
            edits.reduce((previous, current) => {
                ApplyEditAdapter.validateEdit(buffer, current, previous);
                buffer.setTextInRange(current.oldRange, current.newText);
                return current;
            }, null);
            buffer.groupChangesSinceCheckpoint(checkpoint);
            return checkpoint;
        }
        catch (err) {
            buffer.revertToCheckpoint(checkpoint);
            throw err;
        }
    }
    static onApplyEdit(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let changes = params.edit.changes || {};
            if (params.edit.documentChanges) {
                changes = {};
                params.edit.documentChanges.forEach((change) => {
                    if (change && change.textDocument) {
                        changes[change.textDocument.uri] = change.edits;
                    }
                });
            }
            const uris = Object.keys(changes);
            // Keep checkpoints from all successful buffer edits
            const checkpoints = [];
            const promises = uris.map((uri) => __awaiter(this, void 0, void 0, function* () {
                const path = convert_1.default.uriToPath(uri);
                const editor = yield atom.workspace.open(path, {
                    searchAllPanes: true,
                    // Open new editors in the background.
                    activatePane: false,
                    activateItem: false,
                });
                const buffer = editor.getBuffer();
                // Get an existing editor for the file, or open a new one if it doesn't exist.
                const edits = convert_1.default.convertLsTextEdits(changes[uri]);
                const checkpoint = ApplyEditAdapter.applyEdits(buffer, edits);
                checkpoints.push({ buffer, checkpoint });
            }));
            // Apply all edits or fail and revert everything
            const applied = yield Promise.all(promises)
                .then(() => true)
                .catch((err) => {
                atom.notifications.addError('workspace/applyEdits failed', {
                    description: 'Failed to apply edits.',
                    detail: err.message,
                });
                checkpoints.forEach(({ buffer, checkpoint }) => {
                    buffer.revertToCheckpoint(checkpoint);
                });
                return false;
            });
            return { applied };
        });
    }
    // Private: Do some basic sanity checking on the edit ranges.
    static validateEdit(buffer, edit, prevEdit) {
        const path = buffer.getPath() || '';
        if (prevEdit && edit.oldRange.end.compare(prevEdit.oldRange.start) > 0) {
            throw Error(`Found overlapping edit ranges in ${path}`);
        }
        const startRow = edit.oldRange.start.row;
        const startCol = edit.oldRange.start.column;
        const lineLength = buffer.lineLengthForRow(startRow);
        if (lineLength == null || startCol > lineLength) {
            throw Error(`Out of range edit on ${path}:${startRow + 1}:${startCol + 1}`);
        }
    }
}
exports.default = ApplyEditAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHktZWRpdC1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBV2pDLDBEQUEwRDtBQUMxRCxNQUFxQixnQkFBZ0I7SUFDbkMseUVBQXlFO0lBQ2xFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBb0M7UUFDdkQsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxVQUFVLENBQ3RCLE1BQWtCLEVBQ2xCLEtBQXlCO1FBRXpCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzdDLElBQUk7WUFDRix5REFBeUQ7WUFDekQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQWlDLEVBQUUsT0FBTyxFQUFFLEVBQUU7Z0JBQzFELGdCQUFnQixDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxNQUFNLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0MsT0FBTyxVQUFV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QUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDdEUsTUFBTSxLQUFLLENBQUMsb0NBQW9DLElBQUksRUFBRSxDQUFDLENBQUM7U0FDekQ7UUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDekMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzVDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxJQUFJLFVBQVUsSUFBSSxJQUFJLElBQUksUUFBUSxHQUFHLFVBQVUsRUFBRTtZQUMvQyxNQUFNLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLFFBQVEsR0FBRyxDQUFDLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDN0U7SUFDSCxDQUFDO0NBQ0Y7QUFwR0QsbUNBb0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XHJcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xyXG5pbXBvcnQge1xyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBBcHBseVdvcmtzcGFjZUVkaXRQYXJhbXMsXHJcbiAgQXBwbHlXb3Jrc3BhY2VFZGl0UmVzcG9uc2UsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5pbXBvcnQge1xyXG4gIFRleHRCdWZmZXIsXHJcbiAgVGV4dEVkaXRvcixcclxufSBmcm9tICdhdG9tJztcclxuXHJcbi8vIFB1YmxpYzogQWRhcHRzIHdvcmtzcGFjZS9hcHBseUVkaXQgY29tbWFuZHMgdG8gZWRpdG9ycy5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXBwbHlFZGl0QWRhcHRlciB7XHJcbiAgLy8gUHVibGljOiBBdHRhY2ggdG8gYSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byByZWNlaXZlIGVkaXQgZXZlbnRzLlxyXG4gIHB1YmxpYyBzdGF0aWMgYXR0YWNoKGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbikge1xyXG4gICAgY29ubmVjdGlvbi5vbkFwcGx5RWRpdCgobSkgPT4gQXBwbHlFZGl0QWRhcHRlci5vbkFwcGx5RWRpdChtKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUcmllcyB0byBhcHBseSBlZGl0cyBhbmQgcmV2ZXJ0cyBpZiBhbnl0aGluZyBnb2VzIHdyb25nLlxyXG4gICAqIFJldHVybnMgdGhlIGNoZWNrcG9pbnQsIHNvIHRoZSBjYWxsZXIgY2FuIHJldmVydCBjaGFuZ2VzIGlmIG5lZWRlZC5cclxuICAgKi9cclxuICBwdWJsaWMgc3RhdGljIGFwcGx5RWRpdHMoXHJcbiAgICBidWZmZXI6IFRleHRCdWZmZXIsXHJcbiAgICBlZGl0czogYXRvbUlkZS5UZXh0RWRpdFtdLFxyXG4gICk6IG51bWJlciB7XHJcbiAgICBjb25zdCBjaGVja3BvaW50ID0gYnVmZmVyLmNyZWF0ZUNoZWNrcG9pbnQoKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIC8vIFNvcnQgZWRpdHMgaW4gcmV2ZXJzZSBvcmRlciB0byBwcmV2ZW50IGVkaXQgY29uZmxpY3RzLlxyXG4gICAgICBlZGl0cy5zb3J0KChlZGl0MSwgZWRpdDIpID0+IC1lZGl0MS5vbGRSYW5nZS5jb21wYXJlKGVkaXQyLm9sZFJhbmdlKSk7XHJcbiAgICAgIGVkaXRzLnJlZHVjZSgocHJldmlvdXM6IGF0b21JZGUuVGV4dEVkaXQgfCBudWxsLCBjdXJyZW50KSA9PiB7XHJcbiAgICAgICAgQXBwbHlFZGl0QWRhcHRlci52YWxpZGF0ZUVkaXQoYnVmZmVyLCBjdXJyZW50LCBwcmV2aW91cyk7XHJcbiAgICAgICAgYnVmZmVyLnNldFRleHRJblJhbmdlKGN1cnJlbnQub2xkUmFuZ2UsIGN1cnJlbnQubmV3VGV4dCk7XHJcbiAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XHJcbiAgICAgIH0sIG51bGwpO1xyXG4gICAgICBidWZmZXIuZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50KGNoZWNrcG9pbnQpO1xyXG4gICAgICByZXR1cm4gY2hlY2twb2ludDtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBidWZmZXIucmV2ZXJ0VG9DaGVja3BvaW50KGNoZWNrcG9pbnQpO1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGFzeW5jIG9uQXBwbHlFZGl0KHBhcmFtczogQXBwbHlXb3Jrc3BhY2VFZGl0UGFyYW1zKTogUHJvbWlzZTxBcHBseVdvcmtzcGFjZUVkaXRSZXNwb25zZT4ge1xyXG5cclxuICAgIGxldCBjaGFuZ2VzID0gcGFyYW1zLmVkaXQuY2hhbmdlcyB8fCB7fTtcclxuXHJcbiAgICBpZiAocGFyYW1zLmVkaXQuZG9jdW1lbnRDaGFuZ2VzKSB7XHJcbiAgICAgIGNoYW5nZXMgPSB7fTtcclxuICAgICAgcGFyYW1zLmVkaXQuZG9jdW1lbnRDaGFuZ2VzLmZvckVhY2goKGNoYW5nZSkgPT4ge1xyXG4gICAgICAgIGlmIChjaGFuZ2UgJiYgY2hhbmdlLnRleHREb2N1bWVudCkge1xyXG4gICAgICAgICAgY2hhbmdlc1tjaGFuZ2UudGV4dERvY3VtZW50LnVyaV0gPSBjaGFuZ2UuZWRpdHM7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB1cmlzID0gT2JqZWN0LmtleXMoY2hhbmdlcyk7XHJcblxyXG4gICAgLy8gS2VlcCBjaGVja3BvaW50cyBmcm9tIGFsbCBzdWNjZXNzZnVsIGJ1ZmZlciBlZGl0c1xyXG4gICAgY29uc3QgY2hlY2twb2ludHM6IEFycmF5PHsgYnVmZmVyOiBUZXh0QnVmZmVyLCBjaGVja3BvaW50OiBudW1iZXIgfT4gPSBbXTtcclxuXHJcbiAgICBjb25zdCBwcm9taXNlcyA9IHVyaXMubWFwKGFzeW5jICh1cmkpID0+IHtcclxuICAgICAgY29uc3QgcGF0aCA9IENvbnZlcnQudXJpVG9QYXRoKHVyaSk7XHJcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oXHJcbiAgICAgICAgcGF0aCwge1xyXG4gICAgICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXHJcbiAgICAgICAgICAvLyBPcGVuIG5ldyBlZGl0b3JzIGluIHRoZSBiYWNrZ3JvdW5kLlxyXG4gICAgICAgICAgYWN0aXZhdGVQYW5lOiBmYWxzZSxcclxuICAgICAgICAgIGFjdGl2YXRlSXRlbTogZmFsc2UsXHJcbiAgICAgICAgfSxcclxuICAgICAgKSBhcyBUZXh0RWRpdG9yO1xyXG4gICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgICAgIC8vIEdldCBhbiBleGlzdGluZyBlZGl0b3IgZm9yIHRoZSBmaWxlLCBvciBvcGVuIGEgbmV3IG9uZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxyXG4gICAgICBjb25zdCBlZGl0cyA9IENvbnZlcnQuY29udmVydExzVGV4dEVkaXRzKGNoYW5nZXNbdXJpXSk7XHJcbiAgICAgIGNvbnN0IGNoZWNrcG9pbnQgPSBBcHBseUVkaXRBZGFwdGVyLmFwcGx5RWRpdHMoYnVmZmVyLCBlZGl0cyk7XHJcbiAgICAgIGNoZWNrcG9pbnRzLnB1c2goe2J1ZmZlciwgY2hlY2twb2ludH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQXBwbHkgYWxsIGVkaXRzIG9yIGZhaWwgYW5kIHJldmVydCBldmVyeXRoaW5nXHJcbiAgICBjb25zdCBhcHBsaWVkID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpXHJcbiAgICAgIC50aGVuKCgpID0+IHRydWUpXHJcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCd3b3Jrc3BhY2UvYXBwbHlFZGl0cyBmYWlsZWQnLCB7XHJcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZhaWxlZCB0byBhcHBseSBlZGl0cy4nLFxyXG4gICAgICAgICAgZGV0YWlsOiBlcnIubWVzc2FnZSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBjaGVja3BvaW50cy5mb3JFYWNoKCh7YnVmZmVyLCBjaGVja3BvaW50fSkgPT4ge1xyXG4gICAgICAgICAgYnVmZmVyLnJldmVydFRvQ2hlY2twb2ludChjaGVja3BvaW50KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB7YXBwbGllZH07XHJcbiAgfVxyXG5cclxuICAvLyBQcml2YXRlOiBEbyBzb21lIGJhc2ljIHNhbml0eSBjaGVja2luZyBvbiB0aGUgZWRpdCByYW5nZXMuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgdmFsaWRhdGVFZGl0KFxyXG4gICAgYnVmZmVyOiBUZXh0QnVmZmVyLFxyXG4gICAgZWRpdDogYXRvbUlkZS5UZXh0RWRpdCxcclxuICAgIHByZXZFZGl0OiBhdG9tSWRlLlRleHRFZGl0IHwgbnVsbCxcclxuICApOiB2b2lkIHtcclxuICAgIGNvbnN0IHBhdGggPSBidWZmZXIuZ2V0UGF0aCgpIHx8ICcnO1xyXG4gICAgaWYgKHByZXZFZGl0ICYmIGVkaXQub2xkUmFuZ2UuZW5kLmNvbXBhcmUocHJldkVkaXQub2xkUmFuZ2Uuc3RhcnQpID4gMCkge1xyXG4gICAgICB0aHJvdyBFcnJvcihgRm91bmQgb3ZlcmxhcHBpbmcgZWRpdCByYW5nZXMgaW4gJHtwYXRofWApO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc3RhcnRSb3cgPSBlZGl0Lm9sZFJhbmdlLnN0YXJ0LnJvdztcclxuICAgIGNvbnN0IHN0YXJ0Q29sID0gZWRpdC5vbGRSYW5nZS5zdGFydC5jb2x1bW47XHJcbiAgICBjb25zdCBsaW5lTGVuZ3RoID0gYnVmZmVyLmxpbmVMZW5ndGhGb3JSb3coc3RhcnRSb3cpO1xyXG4gICAgaWYgKGxpbmVMZW5ndGggPT0gbnVsbCB8fCBzdGFydENvbCA+IGxpbmVMZW5ndGgpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoYE91dCBvZiByYW5nZSBlZGl0IG9uICR7cGF0aH06JHtzdGFydFJvdyArIDF9OiR7c3RhcnRDb2wgKyAxfWApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/autocomplete-adapter.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/autocomplete-adapter.js ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const Utils = __webpack_require__(/*! ../utils */ "./node_modules/atom-languageclient/build/lib/utils.js");
const fuzzaldrin_plus_1 = __webpack_require__(/*! fuzzaldrin-plus */ "./node_modules/fuzzaldrin-plus/lib/fuzzaldrin.js");
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class PossiblyResolvedCompletionItem {
    constructor(completionItem, isResolved) {
        this.completionItem = completionItem;
        this.isResolved = isResolved;
    }
}
// Public: Adapts the language server protocol "textDocument/completion" to the Atom
// AutoComplete+ package.
class AutocompleteAdapter {
    constructor() {
        this._suggestionCache = new WeakMap();
        this._cancellationTokens = new WeakMap();
    }
    static canAdapt(serverCapabilities) {
        return serverCapabilities.completionProvider != null;
    }
    static canResolve(serverCapabilities) {
        return serverCapabilities.completionProvider != null &&
            serverCapabilities.completionProvider.resolveProvider === true;
    }
    // Public: Obtain suggestion list for AutoComplete+ by querying the language server using
    // the `textDocument/completion` request.
    //
    // * `server` An {ActiveServer} pointing to the language server to query.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` An optional function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Promise} of an {Array} of {atom$AutocompleteSuggestion}s containing the
    // AutoComplete+ suggestions to display.
    getSuggestions(server, request, onDidConvertCompletionItem, minimumWordLength) {
        return __awaiter(this, void 0, void 0, function* () {
            const triggerChars = server.capabilities.completionProvider != null
                ? server.capabilities.completionProvider.triggerCharacters || []
                : [];
            // triggerOnly is true if we have just typed in the trigger character, and is false if we
            // have typed additional characters following the trigger character.
            const [triggerChar, triggerOnly] = AutocompleteAdapter.getTriggerCharacter(request, triggerChars);
            if (!this.shouldTrigger(request, triggerChar, minimumWordLength || 0)) {
                return [];
            }
            // Get the suggestions either from the cache or by calling the language server
            const suggestions = yield this.getOrBuildSuggestions(server, request, triggerChar, triggerOnly, onDidConvertCompletionItem);
            // As the user types more characters to refine filter we must replace those characters on acceptance
            const replacementPrefix = (triggerChar !== '' && triggerOnly) ? '' : request.prefix;
            for (const suggestion of suggestions) {
                suggestion.replacementPrefix = replacementPrefix;
            }
            const filtered = !(request.prefix === "" || (triggerChar !== '' && triggerOnly));
            return filtered ? fuzzaldrin_plus_1.filter(suggestions, request.prefix, { key: 'text' }) : suggestions;
        });
    }
    shouldTrigger(request, triggerChar, minWordLength) {
        return request.activatedManually
            || triggerChar !== ''
            || minWordLength <= 0
            || request.prefix.length >= minWordLength;
    }
    getOrBuildSuggestions(server, request, triggerChar, triggerOnly, onDidConvertCompletionItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this._suggestionCache.get(server);
            const triggerColumn = (triggerChar !== '' && triggerOnly)
                ? request.bufferPosition.column - triggerChar.length
                : request.bufferPosition.column - request.prefix.length - triggerChar.length;
            const triggerPoint = new atom_1.Point(request.bufferPosition.row, triggerColumn);
            // Do we have complete cached suggestions that are still valid for this request?
            if (cache && !cache.isIncomplete && cache.triggerChar === triggerChar
                && cache.triggerPoint.isEqual(triggerPoint)) {
                return Array.from(cache.suggestionMap.keys());
            }
            // Our cached suggestions can't be used so obtain new ones from the language server
            const completions = yield Utils.doWithCancellationToken(server.connection, this._cancellationTokens, (cancellationToken) => server.connection.completion(AutocompleteAdapter.createCompletionParams(request, triggerChar, triggerOnly), cancellationToken));
            // Setup the cache for subsequent filtered results
            const isComplete = Array.isArray(completions) || completions.isIncomplete === false;
            const suggestionMap = this.completionItemsToSuggestions(completions, request, onDidConvertCompletionItem);
            this._suggestionCache.set(server, { isIncomplete: !isComplete, triggerChar, triggerPoint, suggestionMap });
            return Array.from(suggestionMap.keys());
        });
    }
    // Public: Obtain a complete version of a suggestion with additional information
    // the language server can provide by way of the `completionItem/resolve` request.
    //
    // * `server` An {ActiveServer} pointing to the language server to query.
    // * `suggestion` An {atom$AutocompleteSuggestion} suggestion that should be resolved.
    // * `request` An {Object} with the AutoComplete+ request to satisfy.
    // * `onDidConvertCompletionItem` An optional function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Promise} of an {atom$AutocompleteSuggestion} with the resolved AutoComplete+ suggestion.
    completeSuggestion(server, suggestion, request, onDidConvertCompletionItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this._suggestionCache.get(server);
            if (cache) {
                const possiblyResolvedCompletionItem = cache.suggestionMap.get(suggestion);
                if (possiblyResolvedCompletionItem != null && possiblyResolvedCompletionItem.isResolved === false) {
                    const resolvedCompletionItem = yield server.connection.completionItemResolve(possiblyResolvedCompletionItem.completionItem);
                    if (resolvedCompletionItem != null) {
                        AutocompleteAdapter.completionItemToSuggestion(resolvedCompletionItem, suggestion, request, onDidConvertCompletionItem);
                        possiblyResolvedCompletionItem.isResolved = true;
                    }
                }
            }
            return suggestion;
        });
    }
    // Public: Get the trigger character that caused the autocomplete (if any).  This is required because
    // AutoComplete-plus does not have trigger characters.  Although the terminology is 'character' we treat
    // them as variable length strings as this will almost certainly change in the future to support '->' etc.
    //
    // * `request` An {Array} of {atom$AutocompleteSuggestion}s to locate the prefix, editor, bufferPosition etc.
    // * `triggerChars` The {Array} of {string}s that can be trigger characters.
    //
    // Returns a [{string}, boolean] where the string is the matching trigger character or an empty string
    // if one was not matched, and the boolean is true if the trigger character is in request.prefix, and false
    // if it is in the word before request.prefix. The boolean return value has no meaning if the string return
    // value is an empty string.
    static getTriggerCharacter(request, triggerChars) {
        // AutoComplete-Plus considers text after a symbol to be a new trigger. So we should look backward
        // from the current cursor position to see if one is there and thus simulate it.
        const buffer = request.editor.getBuffer();
        const cursor = request.bufferPosition;
        const prefixStartColumn = cursor.column - request.prefix.length;
        for (const triggerChar of triggerChars) {
            if (request.prefix.endsWith(triggerChar)) {
                return [triggerChar, true];
            }
            if (prefixStartColumn >= triggerChar.length) { // Far enough along a line to fit the trigger char
                const start = new atom_1.Point(cursor.row, prefixStartColumn - triggerChar.length);
                const possibleTrigger = buffer.getTextInRange([start, [cursor.row, prefixStartColumn]]);
                if (possibleTrigger === triggerChar) { // The text before our trigger is a trigger char!
                    return [triggerChar, false];
                }
            }
        }
        // There was no explicit trigger char
        return ['', false];
    }
    // Public: Create TextDocumentPositionParams to be sent to the language server
    // based on the editor and position from the AutoCompleteRequest.
    //
    // * `request` The {atom$AutocompleteRequest} to obtain the editor from.
    // * `triggerPoint` The {atom$Point} where the trigger started.
    //
    // Returns a {string} containing the prefix including the trigger character.
    static getPrefixWithTrigger(request, triggerPoint) {
        return request.editor
            .getBuffer()
            .getTextInRange([[triggerPoint.row, triggerPoint.column], request.bufferPosition]);
    }
    // Public: Create {CompletionParams} to be sent to the language server
    // based on the editor and position from the Autocomplete request etc.
    //
    // * `request` The {atom$AutocompleteRequest} containing the request details.
    // * `triggerCharacter` The {string} containing the trigger character (empty if none).
    // * `triggerOnly` A {boolean} representing whether this completion is triggered right after a trigger character.
    //
    // Returns an {CompletionParams} with the keys:
    //  * `textDocument` the language server protocol textDocument identification.
    //  * `position` the position within the text document to display completion request for.
    //  * `context` containing the trigger character and kind.
    static createCompletionParams(request, triggerCharacter, triggerOnly) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(request.editor),
            position: convert_1.default.pointToPosition(request.bufferPosition),
            context: AutocompleteAdapter.createCompletionContext(triggerCharacter, triggerOnly),
        };
    }
    // Public: Create {CompletionContext} to be sent to the language server
    // based on the trigger character.
    //
    // * `triggerCharacter` The {string} containing the trigger character or '' if none.
    // * `triggerOnly` A {boolean} representing whether this completion is triggered right after a trigger character.
    //
    // Returns an {CompletionContext} that specifies the triggerKind and the triggerCharacter
    // if there is one.
    static createCompletionContext(triggerCharacter, triggerOnly) {
        if (triggerCharacter === '') {
            return { triggerKind: languageclient_1.CompletionTriggerKind.Invoked };
        }
        else {
            return triggerOnly
                ? { triggerKind: languageclient_1.CompletionTriggerKind.TriggerCharacter, triggerCharacter }
                : { triggerKind: languageclient_1.CompletionTriggerKind.TriggerForIncompleteCompletions, triggerCharacter };
        }
    }
    // Public: Convert a language server protocol CompletionItem array or CompletionList to
    // an array of ordered AutoComplete+ suggestions.
    //
    // * `completionItems` An {Array} of {CompletionItem} objects or a {CompletionList} containing completion
    //           items to be converted.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` A function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns a {Map} of AutoComplete+ suggestions ordered by the CompletionItems sortText.
    completionItemsToSuggestions(completionItems, request, onDidConvertCompletionItem) {
        return new Map((Array.isArray(completionItems) ? completionItems : completionItems.items || [])
            .sort((a, b) => (a.sortText || a.label).localeCompare(b.sortText || b.label))
            .map((s) => [
            AutocompleteAdapter.completionItemToSuggestion(s, {}, request, onDidConvertCompletionItem),
            new PossiblyResolvedCompletionItem(s, false)
        ]));
    }
    // Public: Convert a language server protocol CompletionItem to an AutoComplete+ suggestion.
    //
    // * `item` An {CompletionItem} containing a completion item to be converted.
    // * `suggestion` A {atom$AutocompleteSuggestion} to have the conversion applied to.
    // * `request` The {atom$AutocompleteRequest} to satisfy.
    // * `onDidConvertCompletionItem` A function that takes a {CompletionItem}, an {atom$AutocompleteSuggestion}
    //   and a {atom$AutocompleteRequest} allowing you to adjust converted items.
    //
    // Returns the {atom$AutocompleteSuggestion} passed in as suggestion with the conversion applied.
    static completionItemToSuggestion(item, suggestion, request, onDidConvertCompletionItem) {
        AutocompleteAdapter.applyCompletionItemToSuggestion(item, suggestion);
        AutocompleteAdapter.applyTextEditToSuggestion(item.textEdit, request.editor, suggestion);
        AutocompleteAdapter.applySnippetToSuggestion(item, suggestion);
        if (onDidConvertCompletionItem != null) {
            onDidConvertCompletionItem(item, suggestion, request);
        }
        return suggestion;
    }
    // Public: Convert the primary parts of a language server protocol CompletionItem to an AutoComplete+ suggestion.
    //
    // * `item` An {CompletionItem} containing the completion items to be merged into.
    // * `suggestion` The {atom$AutocompleteSuggestion} to merge the conversion into.
    //
    // Returns an {atom$AutocompleteSuggestion} created from the {CompletionItem}.
    static applyCompletionItemToSuggestion(item, suggestion) {
        suggestion.text = item.insertText || item.label;
        suggestion.displayText = item.label;
        suggestion.type = AutocompleteAdapter.completionKindToSuggestionType(item.kind);
        suggestion.rightLabel = item.detail;
        // Older format, can't know what it is so assign to both and hope for best
        if (typeof (item.documentation) === 'string') {
            suggestion.descriptionMarkdown = item.documentation;
            suggestion.description = item.documentation;
        }
        if (item.documentation != null && typeof (item.documentation) === 'object') {
            // Newer format specifies the kind of documentation, assign appropriately
            if (item.documentation.kind === 'markdown') {
                suggestion.descriptionMarkdown = item.documentation.value;
            }
            else {
                suggestion.description = item.documentation.value;
            }
        }
    }
    // Public: Applies the textEdit part of a language server protocol CompletionItem to an
    // AutoComplete+ Suggestion via the replacementPrefix and text properties.
    //
    // * `textEdit` A {TextEdit} from a CompletionItem to apply.
    // * `editor` An Atom {TextEditor} used to obtain the necessary text replacement.
    // * `suggestion` An {atom$AutocompleteSuggestion} to set the replacementPrefix and text properties of.
    static applyTextEditToSuggestion(textEdit, editor, suggestion) {
        if (textEdit) {
            suggestion.replacementPrefix = editor.getTextInBufferRange(convert_1.default.lsRangeToAtomRange(textEdit.range));
            suggestion.text = textEdit.newText;
        }
    }
    // Public: Adds a snippet to the suggestion if the CompletionItem contains
    // snippet-formatted text
    //
    // * `item` An {CompletionItem} containing the completion items to be merged into.
    // * `suggestion` The {atom$AutocompleteSuggestion} to merge the conversion into.
    //
    static applySnippetToSuggestion(item, suggestion) {
        if (item.insertTextFormat === languageclient_1.InsertTextFormat.Snippet) {
            suggestion.snippet = item.textEdit != null ? item.textEdit.newText : (item.insertText || '');
        }
    }
    // Public: Obtain the textual suggestion type required by AutoComplete+ that
    // most closely maps to the numeric completion kind supplies by the language server.
    //
    // * `kind` A {Number} that represents the suggestion kind to be converted.
    //
    // Returns a {String} containing the AutoComplete+ suggestion type equivalent
    // to the given completion kind.
    static completionKindToSuggestionType(kind) {
        switch (kind) {
            case languageclient_1.CompletionItemKind.Constant:
                return 'constant';
            case languageclient_1.CompletionItemKind.Method:
                return 'method';
            case languageclient_1.CompletionItemKind.Function:
            case languageclient_1.CompletionItemKind.Constructor:
                return 'function';
            case languageclient_1.CompletionItemKind.Field:
            case languageclient_1.CompletionItemKind.Property:
                return 'property';
            case languageclient_1.CompletionItemKind.Variable:
                return 'variable';
            case languageclient_1.CompletionItemKind.Class:
                return 'class';
            case languageclient_1.CompletionItemKind.Struct:
            case languageclient_1.CompletionItemKind.TypeParameter:
                return 'type';
            case languageclient_1.CompletionItemKind.Operator:
                return 'selector';
            case languageclient_1.CompletionItemKind.Interface:
                return 'mixin';
            case languageclient_1.CompletionItemKind.Module:
                return 'module';
            case languageclient_1.CompletionItemKind.Unit:
                return 'builtin';
            case languageclient_1.CompletionItemKind.Enum:
            case languageclient_1.CompletionItemKind.EnumMember:
                return 'enum';
            case languageclient_1.CompletionItemKind.Keyword:
                return 'keyword';
            case languageclient_1.CompletionItemKind.Snippet:
                return 'snippet';
            case languageclient_1.CompletionItemKind.File:
            case languageclient_1.CompletionItemKind.Folder:
                return 'import';
            case languageclient_1.CompletionItemKind.Reference:
                return 'require';
            default:
                return 'value';
        }
    }
}
exports.default = AutocompleteAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHdDQUFpQztBQUNqQyxrQ0FBa0M7QUFHbEMscURBQXlDO0FBQ3pDLHNEQVcyQjtBQUMzQiwrQkFHYztBQWFkLE1BQU0sOEJBQThCO0lBQ2xDLFlBQ1MsY0FBOEIsRUFDOUIsVUFBbUI7UUFEbkIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1FBQzlCLGVBQVUsR0FBVixVQUFVLENBQVM7SUFFNUIsQ0FBQztDQUNGO0FBRUQsb0ZBQW9GO0FBQ3BGLHlCQUF5QjtBQUN6QixNQUFxQixtQkFBbUI7SUFBeEM7UUFVVSxxQkFBZ0IsR0FBZ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUM5RSx3QkFBbUIsR0FBK0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztJQXNYMUcsQ0FBQztJQWhZUSxNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLGtCQUFrQixDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQztJQUN2RCxDQUFDO0lBRU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxrQkFBc0M7UUFDN0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsSUFBSSxJQUFJO1lBQ2xELGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUM7SUFDbkUsQ0FBQztJQUtELHlGQUF5RjtJQUN6Rix5Q0FBeUM7SUFDekMsRUFBRTtJQUNGLHlFQUF5RTtJQUN6RSx5REFBeUQ7SUFDekQsc0hBQXNIO0lBQ3RILDZFQUE2RTtJQUM3RSxFQUFFO0lBQ0YscUZBQXFGO0lBQ3JGLHdDQUF3QztJQUMzQixjQUFjLENBQ3pCLE1BQW9CLEVBQ3BCLE9BQXFDLEVBQ3JDLDBCQUFtRCxFQUNuRCxpQkFBMEI7O1lBRTFCLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsa0JBQWtCLElBQUksSUFBSTtnQkFDakUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLElBQUksRUFBRTtnQkFDaEUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUVQLHlGQUF5RjtZQUN6RixvRUFBb0U7WUFDcEUsTUFBTSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFbEcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDckUsT0FBTyxFQUFFLENBQUM7YUFDWDtZQUVELDhFQUE4RTtZQUM5RSxNQUFNLFdBQVcsR0FBRyxNQUNsQixJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLDBCQUEwQixDQUFDLENBQUM7WUFFcEcsb0dBQW9HO1lBQ3BHLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxXQUFXLEtBQUssRUFBRSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDcEYsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUU7Z0JBQ3BDLFVBQVUsQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQzthQUNsRDtZQUVELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsS0FBSyxFQUFFLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNqRixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsd0JBQU0sQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDckYsQ0FBQztLQUFBO0lBRU8sYUFBYSxDQUNuQixPQUFxQyxFQUNyQyxXQUFtQixFQUNuQixhQUFxQjtRQUVyQixPQUFPLE9BQU8sQ0FBQyxpQkFBaUI7ZUFDekIsV0FBVyxLQUFLLEVBQUU7ZUFDbEIsYUFBYSxJQUFJLENBQUM7ZUFDbEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksYUFBYSxDQUFDO0lBQ2hELENBQUM7SUFFYSxxQkFBcUIsQ0FDakMsTUFBb0IsRUFDcEIsT0FBcUMsRUFDckMsV0FBbUIsRUFDbkIsV0FBb0IsRUFDcEIsMEJBQW1EOztZQUVuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRWhELE1BQU0sYUFBYSxHQUFHLENBQUMsV0FBVyxLQUFLLEVBQUUsSUFBSSxXQUFXLENBQUM7Z0JBQ3ZELENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTTtnQkFDcEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDL0UsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFMUUsZ0ZBQWdGO1lBQ2hGLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFdBQVc7bUJBQ2hFLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUM3QyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQy9DO1lBRUQsbUZBQW1GO1lBQ25GLE1BQU0sV0FBVyxHQUFHLE1BQU0sS0FBSyxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUMvRixDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FDL0MsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUN4RyxDQUFDO1lBRUYsa0RBQWtEO1lBQ2xELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksV0FBVyxDQUFDLFlBQVksS0FBSyxLQUFLLENBQUM7WUFDcEYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFDLFlBQVksRUFBRSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBQyxDQUFDLENBQUM7WUFFekcsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FBQTtJQUVELGdGQUFnRjtJQUNoRixrRkFBa0Y7SUFDbEYsRUFBRTtJQUNGLHlFQUF5RTtJQUN6RSxzRkFBc0Y7SUFDdEYscUVBQXFFO0lBQ3JFLHNIQUFzSDtJQUN0SCw2RUFBNkU7SUFDN0UsRUFBRTtJQUNGLHNHQUFzRztJQUN6RixrQkFBa0IsQ0FDN0IsTUFBb0IsRUFDcEIsVUFBNEIsRUFDNUIsT0FBcUMsRUFDckMsMEJBQW1EOztZQUVuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELElBQUksS0FBSyxFQUFFO2dCQUNULE1BQU0sOEJBQThCLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzNFLElBQUksOEJBQThCLElBQUksSUFBSSxJQUFJLDhCQUE4QixDQUFDLFVBQVUsS0FBSyxLQUFLLEVBQUU7b0JBQ2pHLE1BQU0sc0JBQXNCLEdBQUcsTUFDN0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyw4QkFBOEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDekYsSUFBSSxzQkFBc0IsSUFBSSxJQUFJLEVBQUU7d0JBQ2xDLG1CQUFtQixDQUFDLDBCQUEwQixDQUM1QyxzQkFBc0IsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixDQUFDLENBQUM7d0JBQzNFLDhCQUE4QixDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7cUJBQ2xEO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLFVBQVUsQ0FBQztRQUNwQixDQUFDO0tBQUE7SUFFRCxxR0FBcUc7SUFDckcsd0dBQXdHO0lBQ3hHLDBHQUEwRztJQUMxRyxFQUFFO0lBQ0YsNkdBQTZHO0lBQzdHLDRFQUE0RTtJQUM1RSxFQUFFO0lBQ0Ysc0dBQXNHO0lBQ3RHLDJHQUEyRztJQUMzRywyR0FBMkc7SUFDM0csNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FDL0IsT0FBcUMsRUFDckMsWUFBc0I7UUFFdEIsa0dBQWtHO1FBQ2xHLGdGQUFnRjtRQUNoRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzFDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFDdEMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2hFLEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFO1lBQ3RDLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDNUI7WUFDRCxJQUFJLGlCQUFpQixJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxrREFBa0Q7Z0JBQy9GLE1BQU0sS0FBSyxHQUFHLElBQUksWUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RSxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEYsSUFBSSxlQUFlLEtBQUssV0FBVyxFQUFFLEVBQUUsaURBQWlEO29CQUN0RixPQUFPLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUM3QjthQUNGO1NBQ0Y7UUFFRCxxQ0FBcUM7UUFDckMsT0FBTyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRUQsOEVBQThFO0lBQzlFLGlFQUFpRTtJQUNqRSxFQUFFO0lBQ0Ysd0VBQXdFO0lBQ3hFLCtEQUErRDtJQUMvRCxFQUFFO0lBQ0YsNEVBQTRFO0lBQ3JFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FDaEMsT0FBcUMsRUFDckMsWUFBbUI7UUFFbkIsT0FBTyxPQUFPLENBQUMsTUFBTTthQUNsQixTQUFTLEVBQUU7YUFDWCxjQUFjLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFFRCxzRUFBc0U7SUFDdEUsc0VBQXNFO0lBQ3RFLEVBQUU7SUFDRiw2RUFBNkU7SUFDN0Usc0ZBQXNGO0lBQ3RGLGlIQUFpSDtJQUNqSCxFQUFFO0lBQ0YsK0NBQStDO0lBQy9DLDhFQUE4RTtJQUM5RSx5RkFBeUY7SUFDekYsMERBQTBEO0lBQ25ELE1BQU0sQ0FBQyxzQkFBc0IsQ0FDbEMsT0FBcUMsRUFDckMsZ0JBQXdCLEVBQ3hCLFdBQW9CO1FBRXBCLE9BQU87WUFDTCxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ3BFLFFBQVEsRUFBRSxpQkFBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDO1lBQ3pELE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyx1QkFBdUIsQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUM7U0FDcEYsQ0FBQztJQUNKLENBQUM7SUFFRCx1RUFBdUU7SUFDdkUsa0NBQWtDO0lBQ2xDLEVBQUU7SUFDRixvRkFBb0Y7SUFDcEYsaUhBQWlIO0lBQ2pILEVBQUU7SUFDRix5RkFBeUY7SUFDekYsbUJBQW1CO0lBQ1osTUFBTSxDQUFDLHVCQUF1QixDQUFDLGdCQUF3QixFQUFFLFdBQW9CO1FBQ2xGLElBQUksZ0JBQWdCLEtBQUssRUFBRSxFQUFFO1lBQzNCLE9BQU8sRUFBQyxXQUFXLEVBQUUsc0NBQXFCLENBQUMsT0FBTyxFQUFDLENBQUM7U0FDckQ7YUFBTTtZQUNMLE9BQU8sV0FBVztnQkFDaEIsQ0FBQyxDQUFDLEVBQUMsV0FBVyxFQUFFLHNDQUFxQixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDO2dCQUN6RSxDQUFDLENBQUMsRUFBQyxXQUFXLEVBQUUsc0NBQXFCLENBQUMsK0JBQStCLEVBQUUsZ0JBQWdCLEVBQUMsQ0FBQztTQUM1RjtJQUNILENBQUM7SUFFRCx1RkFBdUY7SUFDdkYsaURBQWlEO0lBQ2pELEVBQUU7SUFDRix5R0FBeUc7SUFDekcsbUNBQW1DO0lBQ25DLHlEQUF5RDtJQUN6RCw0R0FBNEc7SUFDNUcsNkVBQTZFO0lBQzdFLEVBQUU7SUFDRix3RkFBd0Y7SUFDakYsNEJBQTRCLENBQ2pDLGVBQWtELEVBQ2xELE9BQXFDLEVBQ3JDLDBCQUFtRDtRQUVuRCxPQUFPLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQzthQUM1RixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUM1RSxHQUFHLENBQ0YsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ0wsbUJBQW1CLENBQUMsMEJBQTBCLENBQzVDLENBQUMsRUFBRSxFQUFzQixFQUFFLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQztZQUMvRCxJQUFJLDhCQUE4QixDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7U0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQsNEZBQTRGO0lBQzVGLEVBQUU7SUFDRiw2RUFBNkU7SUFDN0Usb0ZBQW9GO0lBQ3BGLHlEQUF5RDtJQUN6RCw0R0FBNEc7SUFDNUcsNkVBQTZFO0lBQzdFLEVBQUU7SUFDRixpR0FBaUc7SUFDMUYsTUFBTSxDQUFDLDBCQUEwQixDQUN0QyxJQUFvQixFQUNwQixVQUE0QixFQUM1QixPQUFxQyxFQUNyQywwQkFBbUQ7UUFFbkQsbUJBQW1CLENBQUMsK0JBQStCLENBQUMsSUFBSSxFQUFFLFVBQStCLENBQUMsQ0FBQztRQUMzRixtQkFBbUIsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsVUFBK0IsQ0FBQyxDQUFDO1FBQzlHLG1CQUFtQixDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxVQUFrQyxDQUFDLENBQUM7UUFDdkYsSUFBSSwwQkFBMEIsSUFBSSxJQUFJLEVBQUU7WUFDdEMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN2RDtRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxpSEFBaUg7SUFDakgsRUFBRTtJQUNGLGtGQUFrRjtJQUNsRixpRkFBaUY7SUFDakYsRUFBRTtJQUNGLDhFQUE4RTtJQUN2RSxNQUFNLENBQUMsK0JBQStCLENBQzNDLElBQW9CLEVBQ3BCLFVBQTZCO1FBRTdCLFVBQVUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2hELFVBQVUsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNwQyxVQUFVLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDLDhCQUE4QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRixVQUFVLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFcEMsMEVBQTBFO1FBQzFFLElBQUksT0FBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDM0MsVUFBVSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDcEQsVUFBVSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1NBQzdDO1FBRUQsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksSUFBSSxPQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLFFBQVEsRUFBRTtZQUN6RSx5RUFBeUU7WUFDekUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUU7Z0JBQzFDLFVBQVUsQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQzthQUMzRDtpQkFBTTtnQkFDTCxVQUFVLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO2FBQ25EO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsdUZBQXVGO0lBQ3ZGLDBFQUEwRTtJQUMxRSxFQUFFO0lBQ0YsNERBQTREO0lBQzVELGlGQUFpRjtJQUNqRix1R0FBdUc7SUFDaEcsTUFBTSxDQUFDLHlCQUF5QixDQUNyQyxRQUE4QixFQUM5QixNQUFrQixFQUNsQixVQUE2QjtRQUU3QixJQUFJLFFBQVEsRUFBRTtZQUNaLFVBQVUsQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RyxVQUFVLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUM7U0FDcEM7SUFDSCxDQUFDO0lBRUQsMEVBQTBFO0lBQzFFLHlCQUF5QjtJQUN6QixFQUFFO0lBQ0Ysa0ZBQWtGO0lBQ2xGLGlGQUFpRjtJQUNqRixFQUFFO0lBQ0ssTUFBTSxDQUFDLHdCQUF3QixDQUFDLElBQW9CLEVBQUUsVUFBZ0M7UUFDM0YsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEtBQUssaUNBQWdCLENBQUMsT0FBTyxFQUFFO1lBQ3RELFVBQVUsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLENBQUM7U0FDOUY7SUFDSCxDQUFDO0lBRUQsNEVBQTRFO0lBQzVFLG9GQUFvRjtJQUNwRixFQUFFO0lBQ0YsMkVBQTJFO0lBQzNFLEVBQUU7SUFDRiw2RUFBNkU7SUFDN0UsZ0NBQWdDO0lBQ3pCLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxJQUF3QjtRQUNuRSxRQUFRLElBQUksRUFBRTtZQUNaLEtBQUssbUNBQWtCLENBQUMsUUFBUTtnQkFDOUIsT0FBTyxVQUFVLENBQUM7WUFDcEIsS0FBSyxtQ0FBa0IsQ0FBQyxNQUFNO2dCQUM1QixPQUFPLFFBQVEsQ0FBQztZQUNsQixLQUFLLG1DQUFrQixDQUFDLFFBQVEsQ0FBQztZQUNqQyxLQUFLLG1DQUFrQixDQUFDLFdBQVc7Z0JBQ2pDLE9BQU8sVUFBVSxDQUFDO1lBQ3BCLEtBQUssbUNBQWtCLENBQUMsS0FBSyxDQUFDO1lBQzlCLEtBQUssbUNBQWtCLENBQUMsUUFBUTtnQkFDOUIsT0FBTyxVQUFVLENBQUM7WUFDcEIsS0FBSyxtQ0FBa0IsQ0FBQyxRQUFRO2dCQUM5QixPQUFPLFVBQVUsQ0FBQztZQUNwQixLQUFLLG1DQUFrQixDQUFDLEtBQUs7Z0JBQzNCLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLEtBQUssbUNBQWtCLENBQUMsTUFBTSxDQUFDO1lBQy9CLEtBQUssbUNBQWtCLENBQUMsYUFBYTtnQkFDbkMsT0FBTyxNQUFNLENBQUM7WUFDaEIsS0FBSyxtQ0FBa0IsQ0FBQyxRQUFRO2dCQUM5QixPQUFPLFVBQVUsQ0FBQztZQUNwQixLQUFLLG1DQUFrQixDQUFDLFNBQVM7Z0JBQy9CLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLEtBQUssbUNBQWtCLENBQUMsTUFBTTtnQkFDNUIsT0FBTyxRQUFRLENBQUM7WUFDbEIsS0FBSyxtQ0FBa0IsQ0FBQyxJQUFJO2dCQUMxQixPQUFPLFNBQVMsQ0FBQztZQUNuQixLQUFLLG1DQUFrQixDQUFDLElBQUksQ0FBQztZQUM3QixLQUFLLG1DQUFrQixDQUFDLFVBQVU7Z0JBQ2hDLE9BQU8sTUFBTSxDQUFDO1lBQ2hCLEtBQUssbUNBQWtCLENBQUMsT0FBTztnQkFDN0IsT0FBTyxTQUFTLENBQUM7WUFDbkIsS0FBSyxtQ0FBa0IsQ0FBQyxPQUFPO2dCQUM3QixPQUFPLFNBQVMsQ0FBQztZQUNuQixLQUFLLG1DQUFrQixDQUFDLElBQUksQ0FBQztZQUM3QixLQUFLLG1DQUFrQixDQUFDLE1BQU07Z0JBQzVCLE9BQU8sUUFBUSxDQUFDO1lBQ2xCLEtBQUssbUNBQWtCLENBQUMsU0FBUztnQkFDL0IsT0FBTyxTQUFTLENBQUM7WUFDbkI7Z0JBQ0UsT0FBTyxPQUFPLENBQUM7U0FDbEI7SUFDSCxDQUFDO0NBQ0Y7QUFqWUQsc0NBaVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL3V0aWxzJztcclxuaW1wb3J0IHsgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2UgfSBmcm9tICd2c2NvZGUtanNvbnJwYyc7XHJcbmltcG9ydCB7IEFjdGl2ZVNlcnZlciB9IGZyb20gJy4uL3NlcnZlci1tYW5hZ2VyJztcclxuaW1wb3J0IHsgZmlsdGVyIH0gZnJvbSAnZnV6emFsZHJpbi1wbHVzJztcclxuaW1wb3J0IHtcclxuICBDb21wbGV0aW9uQ29udGV4dCxcclxuICBDb21wbGV0aW9uSXRlbSxcclxuICBDb21wbGV0aW9uSXRlbUtpbmQsXHJcbiAgQ29tcGxldGlvbkxpc3QsXHJcbiAgQ29tcGxldGlvblBhcmFtcyxcclxuICBDb21wbGV0aW9uVHJpZ2dlcktpbmQsXHJcbiAgSW5zZXJ0VGV4dEZvcm1hdCxcclxuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxyXG4gIFRleHRFZGl0LFxyXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcclxuaW1wb3J0IHtcclxuICBQb2ludCxcclxuICBUZXh0RWRpdG9yLFxyXG59IGZyb20gJ2F0b20nO1xyXG5pbXBvcnQgKiBhcyBhYyBmcm9tICdhdG9tL2F1dG9jb21wbGV0ZS1wbHVzJztcclxuXHJcbmludGVyZmFjZSBTdWdnZXN0aW9uQ2FjaGVFbnRyeSB7XHJcbiAgaXNJbmNvbXBsZXRlOiBib29sZWFuO1xyXG4gIHRyaWdnZXJQb2ludDogUG9pbnQ7XHJcbiAgdHJpZ2dlckNoYXI6IHN0cmluZztcclxuICBzdWdnZXN0aW9uTWFwOiBNYXA8YWMuQW55U3VnZ2VzdGlvbiwgUG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtPjtcclxufVxyXG5cclxudHlwZSBDb21wbGV0aW9uSXRlbUFkanVzdGVyID1cclxuICAoaXRlbTogQ29tcGxldGlvbkl0ZW0sIHN1Z2dlc3Rpb246IGFjLkFueVN1Z2dlc3Rpb24sIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQpID0+IHZvaWQ7XHJcblxyXG5jbGFzcyBQb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW0ge1xyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHVibGljIGNvbXBsZXRpb25JdGVtOiBDb21wbGV0aW9uSXRlbSxcclxuICAgIHB1YmxpYyBpc1Jlc29sdmVkOiBib29sZWFuLFxyXG4gICkge1xyXG4gIH1cclxufVxyXG5cclxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBcInRleHREb2N1bWVudC9jb21wbGV0aW9uXCIgdG8gdGhlIEF0b21cclxuLy8gQXV0b0NvbXBsZXRlKyBwYWNrYWdlLlxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRvY29tcGxldGVBZGFwdGVyIHtcclxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmNvbXBsZXRpb25Qcm92aWRlciAhPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0YXRpYyBjYW5SZXNvbHZlKHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmNvbXBsZXRpb25Qcm92aWRlciAhPSBudWxsICYmXHJcbiAgICAgIHNlcnZlckNhcGFiaWxpdGllcy5jb21wbGV0aW9uUHJvdmlkZXIucmVzb2x2ZVByb3ZpZGVyID09PSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfc3VnZ2VzdGlvbkNhY2hlOiBXZWFrTWFwPEFjdGl2ZVNlcnZlciwgU3VnZ2VzdGlvbkNhY2hlRW50cnk+ID0gbmV3IFdlYWtNYXAoKTtcclxuICBwcml2YXRlIF9jYW5jZWxsYXRpb25Ub2tlbnM6IFdlYWtNYXA8TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLCBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZT4gPSBuZXcgV2Vha01hcCgpO1xyXG5cclxuICAvLyBQdWJsaWM6IE9idGFpbiBzdWdnZXN0aW9uIGxpc3QgZm9yIEF1dG9Db21wbGV0ZSsgYnkgcXVlcnlpbmcgdGhlIGxhbmd1YWdlIHNlcnZlciB1c2luZ1xyXG4gIC8vIHRoZSBgdGV4dERvY3VtZW50L2NvbXBsZXRpb25gIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBzZXJ2ZXJgIEFuIHtBY3RpdmVTZXJ2ZXJ9IHBvaW50aW5nIHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gcXVlcnkuXHJcbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IHRvIHNhdGlzZnkuXHJcbiAgLy8gKiBgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW1gIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7Q29tcGxldGlvbkl0ZW19LCBhbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufVxyXG4gIC8vICAgYW5kIGEge2F0b20kQXV0b2NvbXBsZXRlUmVxdWVzdH0gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBjb252ZXJ0ZWQgaXRlbXMuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHtBcnJheX0gb2Yge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1zIGNvbnRhaW5pbmcgdGhlXHJcbiAgLy8gQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9ucyB0byBkaXNwbGF5LlxyXG4gIHB1YmxpYyBhc3luYyBnZXRTdWdnZXN0aW9ucyhcclxuICAgIHNlcnZlcjogQWN0aXZlU2VydmVyLFxyXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcclxuICAgIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtPzogQ29tcGxldGlvbkl0ZW1BZGp1c3RlcixcclxuICAgIG1pbmltdW1Xb3JkTGVuZ3RoPzogbnVtYmVyLFxyXG4gICk6IFByb21pc2U8YWMuQW55U3VnZ2VzdGlvbltdPiB7XHJcbiAgICBjb25zdCB0cmlnZ2VyQ2hhcnMgPSBzZXJ2ZXIuY2FwYWJpbGl0aWVzLmNvbXBsZXRpb25Qcm92aWRlciAhPSBudWxsXHJcbiAgICAgID8gc2VydmVyLmNhcGFiaWxpdGllcy5jb21wbGV0aW9uUHJvdmlkZXIudHJpZ2dlckNoYXJhY3RlcnMgfHwgW11cclxuICAgICAgOiBbXTtcclxuXHJcbiAgICAvLyB0cmlnZ2VyT25seSBpcyB0cnVlIGlmIHdlIGhhdmUganVzdCB0eXBlZCBpbiB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIsIGFuZCBpcyBmYWxzZSBpZiB3ZVxyXG4gICAgLy8gaGF2ZSB0eXBlZCBhZGRpdGlvbmFsIGNoYXJhY3RlcnMgZm9sbG93aW5nIHRoZSB0cmlnZ2VyIGNoYXJhY3Rlci5cclxuICAgIGNvbnN0IFt0cmlnZ2VyQ2hhciwgdHJpZ2dlck9ubHldID0gQXV0b2NvbXBsZXRlQWRhcHRlci5nZXRUcmlnZ2VyQ2hhcmFjdGVyKHJlcXVlc3QsIHRyaWdnZXJDaGFycyk7XHJcblxyXG4gICAgaWYgKCF0aGlzLnNob3VsZFRyaWdnZXIocmVxdWVzdCwgdHJpZ2dlckNoYXIsIG1pbmltdW1Xb3JkTGVuZ3RoIHx8IDApKSB7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBHZXQgdGhlIHN1Z2dlc3Rpb25zIGVpdGhlciBmcm9tIHRoZSBjYWNoZSBvciBieSBjYWxsaW5nIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcclxuICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gYXdhaXRcclxuICAgICAgdGhpcy5nZXRPckJ1aWxkU3VnZ2VzdGlvbnMoc2VydmVyLCByZXF1ZXN0LCB0cmlnZ2VyQ2hhciwgdHJpZ2dlck9ubHksIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtKTtcclxuXHJcbiAgICAvLyBBcyB0aGUgdXNlciB0eXBlcyBtb3JlIGNoYXJhY3RlcnMgdG8gcmVmaW5lIGZpbHRlciB3ZSBtdXN0IHJlcGxhY2UgdGhvc2UgY2hhcmFjdGVycyBvbiBhY2NlcHRhbmNlXHJcbiAgICBjb25zdCByZXBsYWNlbWVudFByZWZpeCA9ICh0cmlnZ2VyQ2hhciAhPT0gJycgJiYgdHJpZ2dlck9ubHkpID8gJycgOiByZXF1ZXN0LnByZWZpeDtcclxuICAgIGZvciAoY29uc3Qgc3VnZ2VzdGlvbiBvZiBzdWdnZXN0aW9ucykge1xyXG4gICAgICBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4ID0gcmVwbGFjZW1lbnRQcmVmaXg7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZmlsdGVyZWQgPSAhKHJlcXVlc3QucHJlZml4ID09PSBcIlwiIHx8ICh0cmlnZ2VyQ2hhciAhPT0gJycgJiYgdHJpZ2dlck9ubHkpKTtcclxuICAgIHJldHVybiBmaWx0ZXJlZCA/IGZpbHRlcihzdWdnZXN0aW9ucywgcmVxdWVzdC5wcmVmaXgsIHtrZXk6ICd0ZXh0J30pIDogc3VnZ2VzdGlvbnM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNob3VsZFRyaWdnZXIoXHJcbiAgICByZXF1ZXN0OiBhYy5TdWdnZXN0aW9uc1JlcXVlc3RlZEV2ZW50LFxyXG4gICAgdHJpZ2dlckNoYXI6IHN0cmluZyxcclxuICAgIG1pbldvcmRMZW5ndGg6IG51bWJlcixcclxuICApOiBib29sZWFuIHtcclxuICAgIHJldHVybiByZXF1ZXN0LmFjdGl2YXRlZE1hbnVhbGx5XHJcbiAgICAgICAgfHwgdHJpZ2dlckNoYXIgIT09ICcnXHJcbiAgICAgICAgfHwgbWluV29yZExlbmd0aCA8PSAwXHJcbiAgICAgICAgfHwgcmVxdWVzdC5wcmVmaXgubGVuZ3RoID49IG1pbldvcmRMZW5ndGg7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIGdldE9yQnVpbGRTdWdnZXN0aW9ucyhcclxuICAgIHNlcnZlcjogQWN0aXZlU2VydmVyLFxyXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcclxuICAgIHRyaWdnZXJDaGFyOiBzdHJpbmcsXHJcbiAgICB0cmlnZ2VyT25seTogYm9vbGVhbixcclxuICAgIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtPzogQ29tcGxldGlvbkl0ZW1BZGp1c3RlcixcclxuICApOiBQcm9taXNlPGFjLkFueVN1Z2dlc3Rpb25bXT4ge1xyXG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLl9zdWdnZXN0aW9uQ2FjaGUuZ2V0KHNlcnZlcik7XHJcblxyXG4gICAgY29uc3QgdHJpZ2dlckNvbHVtbiA9ICh0cmlnZ2VyQ2hhciAhPT0gJycgJiYgdHJpZ2dlck9ubHkpXHJcbiAgICAgID8gcmVxdWVzdC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSB0cmlnZ2VyQ2hhci5sZW5ndGhcclxuICAgICAgOiByZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uLmNvbHVtbiAtIHJlcXVlc3QucHJlZml4Lmxlbmd0aCAtIHRyaWdnZXJDaGFyLmxlbmd0aDtcclxuICAgIGNvbnN0IHRyaWdnZXJQb2ludCA9IG5ldyBQb2ludChyZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uLnJvdywgdHJpZ2dlckNvbHVtbik7XHJcblxyXG4gICAgLy8gRG8gd2UgaGF2ZSBjb21wbGV0ZSBjYWNoZWQgc3VnZ2VzdGlvbnMgdGhhdCBhcmUgc3RpbGwgdmFsaWQgZm9yIHRoaXMgcmVxdWVzdD9cclxuICAgIGlmIChjYWNoZSAmJiAhY2FjaGUuaXNJbmNvbXBsZXRlICYmIGNhY2hlLnRyaWdnZXJDaGFyID09PSB0cmlnZ2VyQ2hhclxyXG4gICAgICAmJiBjYWNoZS50cmlnZ2VyUG9pbnQuaXNFcXVhbCh0cmlnZ2VyUG9pbnQpKSB7XHJcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKGNhY2hlLnN1Z2dlc3Rpb25NYXAua2V5cygpKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBPdXIgY2FjaGVkIHN1Z2dlc3Rpb25zIGNhbid0IGJlIHVzZWQgc28gb2J0YWluIG5ldyBvbmVzIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlclxyXG4gICAgY29uc3QgY29tcGxldGlvbnMgPSBhd2FpdCBVdGlscy5kb1dpdGhDYW5jZWxsYXRpb25Ub2tlbihzZXJ2ZXIuY29ubmVjdGlvbiwgdGhpcy5fY2FuY2VsbGF0aW9uVG9rZW5zLFxyXG4gICAgICAgIChjYW5jZWxsYXRpb25Ub2tlbikgPT4gc2VydmVyLmNvbm5lY3Rpb24uY29tcGxldGlvbihcclxuICAgICAgICAgICAgQXV0b2NvbXBsZXRlQWRhcHRlci5jcmVhdGVDb21wbGV0aW9uUGFyYW1zKHJlcXVlc3QsIHRyaWdnZXJDaGFyLCB0cmlnZ2VyT25seSksIGNhbmNlbGxhdGlvblRva2VuKSxcclxuICAgICk7XHJcblxyXG4gICAgLy8gU2V0dXAgdGhlIGNhY2hlIGZvciBzdWJzZXF1ZW50IGZpbHRlcmVkIHJlc3VsdHNcclxuICAgIGNvbnN0IGlzQ29tcGxldGUgPSBBcnJheS5pc0FycmF5KGNvbXBsZXRpb25zKSB8fCBjb21wbGV0aW9ucy5pc0luY29tcGxldGUgPT09IGZhbHNlO1xyXG4gICAgY29uc3Qgc3VnZ2VzdGlvbk1hcCA9IHRoaXMuY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhjb21wbGV0aW9ucywgcmVxdWVzdCwgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0pO1xyXG4gICAgdGhpcy5fc3VnZ2VzdGlvbkNhY2hlLnNldChzZXJ2ZXIsIHtpc0luY29tcGxldGU6ICFpc0NvbXBsZXRlLCB0cmlnZ2VyQ2hhciwgdHJpZ2dlclBvaW50LCBzdWdnZXN0aW9uTWFwfSk7XHJcblxyXG4gICAgcmV0dXJuIEFycmF5LmZyb20oc3VnZ2VzdGlvbk1hcC5rZXlzKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBPYnRhaW4gYSBjb21wbGV0ZSB2ZXJzaW9uIG9mIGEgc3VnZ2VzdGlvbiB3aXRoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb25cclxuICAvLyB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGNhbiBwcm92aWRlIGJ5IHdheSBvZiB0aGUgYGNvbXBsZXRpb25JdGVtL3Jlc29sdmVgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBzZXJ2ZXJgIEFuIHtBY3RpdmVTZXJ2ZXJ9IHBvaW50aW5nIHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gcXVlcnkuXHJcbiAgLy8gKiBgc3VnZ2VzdGlvbmAgQW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gc3VnZ2VzdGlvbiB0aGF0IHNob3VsZCBiZSByZXNvbHZlZC5cclxuICAvLyAqIGByZXF1ZXN0YCBBbiB7T2JqZWN0fSB3aXRoIHRoZSBBdXRvQ29tcGxldGUrIHJlcXVlc3QgdG8gc2F0aXNmeS5cclxuICAvLyAqIGBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbWAgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHtDb21wbGV0aW9uSXRlbX0sIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259XHJcbiAgLy8gICBhbmQgYSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGNvbnZlcnRlZCBpdGVtcy5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gd2l0aCB0aGUgcmVzb2x2ZWQgQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9uLlxyXG4gIHB1YmxpYyBhc3luYyBjb21wbGV0ZVN1Z2dlc3Rpb24oXHJcbiAgICBzZXJ2ZXI6IEFjdGl2ZVNlcnZlcixcclxuICAgIHN1Z2dlc3Rpb246IGFjLkFueVN1Z2dlc3Rpb24sXHJcbiAgICByZXF1ZXN0OiBhYy5TdWdnZXN0aW9uc1JlcXVlc3RlZEV2ZW50LFxyXG4gICAgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0/OiBDb21wbGV0aW9uSXRlbUFkanVzdGVyLFxyXG4gICk6IFByb21pc2U8YWMuQW55U3VnZ2VzdGlvbj4ge1xyXG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLl9zdWdnZXN0aW9uQ2FjaGUuZ2V0KHNlcnZlcik7XHJcbiAgICBpZiAoY2FjaGUpIHtcclxuICAgICAgY29uc3QgcG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtID0gY2FjaGUuc3VnZ2VzdGlvbk1hcC5nZXQoc3VnZ2VzdGlvbik7XHJcbiAgICAgIGlmIChwb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW0gIT0gbnVsbCAmJiBwb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW0uaXNSZXNvbHZlZCA9PT0gZmFsc2UpIHtcclxuICAgICAgICBjb25zdCByZXNvbHZlZENvbXBsZXRpb25JdGVtID0gYXdhaXRcclxuICAgICAgICAgIHNlcnZlci5jb25uZWN0aW9uLmNvbXBsZXRpb25JdGVtUmVzb2x2ZShwb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW0uY29tcGxldGlvbkl0ZW0pO1xyXG4gICAgICAgIGlmIChyZXNvbHZlZENvbXBsZXRpb25JdGVtICE9IG51bGwpIHtcclxuICAgICAgICAgIEF1dG9jb21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oXHJcbiAgICAgICAgICAgIHJlc29sdmVkQ29tcGxldGlvbkl0ZW0sIHN1Z2dlc3Rpb24sIHJlcXVlc3QsIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtKTtcclxuICAgICAgICAgIHBvc3NpYmx5UmVzb2x2ZWRDb21wbGV0aW9uSXRlbS5pc1Jlc29sdmVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzdWdnZXN0aW9uO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBHZXQgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIHRoYXQgY2F1c2VkIHRoZSBhdXRvY29tcGxldGUgKGlmIGFueSkuICBUaGlzIGlzIHJlcXVpcmVkIGJlY2F1c2VcclxuICAvLyBBdXRvQ29tcGxldGUtcGx1cyBkb2VzIG5vdCBoYXZlIHRyaWdnZXIgY2hhcmFjdGVycy4gIEFsdGhvdWdoIHRoZSB0ZXJtaW5vbG9neSBpcyAnY2hhcmFjdGVyJyB3ZSB0cmVhdFxyXG4gIC8vIHRoZW0gYXMgdmFyaWFibGUgbGVuZ3RoIHN0cmluZ3MgYXMgdGhpcyB3aWxsIGFsbW9zdCBjZXJ0YWlubHkgY2hhbmdlIGluIHRoZSBmdXR1cmUgdG8gc3VwcG9ydCAnLT4nIGV0Yy5cclxuICAvL1xyXG4gIC8vICogYHJlcXVlc3RgIEFuIHtBcnJheX0gb2Yge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn1zIHRvIGxvY2F0ZSB0aGUgcHJlZml4LCBlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uIGV0Yy5cclxuICAvLyAqIGB0cmlnZ2VyQ2hhcnNgIFRoZSB7QXJyYXl9IG9mIHtzdHJpbmd9cyB0aGF0IGNhbiBiZSB0cmlnZ2VyIGNoYXJhY3RlcnMuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEgW3tzdHJpbmd9LCBib29sZWFuXSB3aGVyZSB0aGUgc3RyaW5nIGlzIHRoZSBtYXRjaGluZyB0cmlnZ2VyIGNoYXJhY3RlciBvciBhbiBlbXB0eSBzdHJpbmdcclxuICAvLyBpZiBvbmUgd2FzIG5vdCBtYXRjaGVkLCBhbmQgdGhlIGJvb2xlYW4gaXMgdHJ1ZSBpZiB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIgaXMgaW4gcmVxdWVzdC5wcmVmaXgsIGFuZCBmYWxzZVxyXG4gIC8vIGlmIGl0IGlzIGluIHRoZSB3b3JkIGJlZm9yZSByZXF1ZXN0LnByZWZpeC4gVGhlIGJvb2xlYW4gcmV0dXJuIHZhbHVlIGhhcyBubyBtZWFuaW5nIGlmIHRoZSBzdHJpbmcgcmV0dXJuXHJcbiAgLy8gdmFsdWUgaXMgYW4gZW1wdHkgc3RyaW5nLlxyXG4gIHB1YmxpYyBzdGF0aWMgZ2V0VHJpZ2dlckNoYXJhY3RlcihcclxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXHJcbiAgICB0cmlnZ2VyQ2hhcnM6IHN0cmluZ1tdLFxyXG4gICk6IFtzdHJpbmcsIGJvb2xlYW5dIHtcclxuICAgIC8vIEF1dG9Db21wbGV0ZS1QbHVzIGNvbnNpZGVycyB0ZXh0IGFmdGVyIGEgc3ltYm9sIHRvIGJlIGEgbmV3IHRyaWdnZXIuIFNvIHdlIHNob3VsZCBsb29rIGJhY2t3YXJkXHJcbiAgICAvLyBmcm9tIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB0byBzZWUgaWYgb25lIGlzIHRoZXJlIGFuZCB0aHVzIHNpbXVsYXRlIGl0LlxyXG4gICAgY29uc3QgYnVmZmVyID0gcmVxdWVzdC5lZGl0b3IuZ2V0QnVmZmVyKCk7XHJcbiAgICBjb25zdCBjdXJzb3IgPSByZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uO1xyXG4gICAgY29uc3QgcHJlZml4U3RhcnRDb2x1bW4gPSBjdXJzb3IuY29sdW1uIC0gcmVxdWVzdC5wcmVmaXgubGVuZ3RoO1xyXG4gICAgZm9yIChjb25zdCB0cmlnZ2VyQ2hhciBvZiB0cmlnZ2VyQ2hhcnMpIHtcclxuICAgICAgaWYgKHJlcXVlc3QucHJlZml4LmVuZHNXaXRoKHRyaWdnZXJDaGFyKSkge1xyXG4gICAgICAgIHJldHVybiBbdHJpZ2dlckNoYXIsIHRydWVdO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwcmVmaXhTdGFydENvbHVtbiA+PSB0cmlnZ2VyQ2hhci5sZW5ndGgpIHsgLy8gRmFyIGVub3VnaCBhbG9uZyBhIGxpbmUgdG8gZml0IHRoZSB0cmlnZ2VyIGNoYXJcclxuICAgICAgICBjb25zdCBzdGFydCA9IG5ldyBQb2ludChjdXJzb3Iucm93LCBwcmVmaXhTdGFydENvbHVtbiAtIHRyaWdnZXJDaGFyLmxlbmd0aCk7XHJcbiAgICAgICAgY29uc3QgcG9zc2libGVUcmlnZ2VyID0gYnVmZmVyLmdldFRleHRJblJhbmdlKFtzdGFydCwgW2N1cnNvci5yb3csIHByZWZpeFN0YXJ0Q29sdW1uXV0pO1xyXG4gICAgICAgIGlmIChwb3NzaWJsZVRyaWdnZXIgPT09IHRyaWdnZXJDaGFyKSB7IC8vIFRoZSB0ZXh0IGJlZm9yZSBvdXIgdHJpZ2dlciBpcyBhIHRyaWdnZXIgY2hhciFcclxuICAgICAgICAgIHJldHVybiBbdHJpZ2dlckNoYXIsIGZhbHNlXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGVyZSB3YXMgbm8gZXhwbGljaXQgdHJpZ2dlciBjaGFyXHJcbiAgICByZXR1cm4gWycnLCBmYWxzZV07XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSBUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyB0byBiZSBzZW50IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcclxuICAvLyBiYXNlZCBvbiB0aGUgZWRpdG9yIGFuZCBwb3NpdGlvbiBmcm9tIHRoZSBBdXRvQ29tcGxldGVSZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IHRvIG9idGFpbiB0aGUgZWRpdG9yIGZyb20uXHJcbiAgLy8gKiBgdHJpZ2dlclBvaW50YCBUaGUge2F0b20kUG9pbnR9IHdoZXJlIHRoZSB0cmlnZ2VyIHN0YXJ0ZWQuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge3N0cmluZ30gY29udGFpbmluZyB0aGUgcHJlZml4IGluY2x1ZGluZyB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIuXHJcbiAgcHVibGljIHN0YXRpYyBnZXRQcmVmaXhXaXRoVHJpZ2dlcihcclxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXHJcbiAgICB0cmlnZ2VyUG9pbnQ6IFBvaW50LFxyXG4gICk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gcmVxdWVzdC5lZGl0b3JcclxuICAgICAgLmdldEJ1ZmZlcigpXHJcbiAgICAgIC5nZXRUZXh0SW5SYW5nZShbW3RyaWdnZXJQb2ludC5yb3csIHRyaWdnZXJQb2ludC5jb2x1bW5dLCByZXF1ZXN0LmJ1ZmZlclBvc2l0aW9uXSk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSB7Q29tcGxldGlvblBhcmFtc30gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gYmFzZWQgb24gdGhlIGVkaXRvciBhbmQgcG9zaXRpb24gZnJvbSB0aGUgQXV0b2NvbXBsZXRlIHJlcXVlc3QgZXRjLlxyXG4gIC8vXHJcbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IGNvbnRhaW5pbmcgdGhlIHJlcXVlc3QgZGV0YWlscy5cclxuICAvLyAqIGB0cmlnZ2VyQ2hhcmFjdGVyYCBUaGUge3N0cmluZ30gY29udGFpbmluZyB0aGUgdHJpZ2dlciBjaGFyYWN0ZXIgKGVtcHR5IGlmIG5vbmUpLlxyXG4gIC8vICogYHRyaWdnZXJPbmx5YCBBIHtib29sZWFufSByZXByZXNlbnRpbmcgd2hldGhlciB0aGlzIGNvbXBsZXRpb24gaXMgdHJpZ2dlcmVkIHJpZ2h0IGFmdGVyIGEgdHJpZ2dlciBjaGFyYWN0ZXIuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGFuIHtDb21wbGV0aW9uUGFyYW1zfSB3aXRoIHRoZSBrZXlzOlxyXG4gIC8vICAqIGB0ZXh0RG9jdW1lbnRgIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgdGV4dERvY3VtZW50IGlkZW50aWZpY2F0aW9uLlxyXG4gIC8vICAqIGBwb3NpdGlvbmAgdGhlIHBvc2l0aW9uIHdpdGhpbiB0aGUgdGV4dCBkb2N1bWVudCB0byBkaXNwbGF5IGNvbXBsZXRpb24gcmVxdWVzdCBmb3IuXHJcbiAgLy8gICogYGNvbnRleHRgIGNvbnRhaW5pbmcgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIGFuZCBraW5kLlxyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlQ29tcGxldGlvblBhcmFtcyhcclxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXHJcbiAgICB0cmlnZ2VyQ2hhcmFjdGVyOiBzdHJpbmcsXHJcbiAgICB0cmlnZ2VyT25seTogYm9vbGVhbixcclxuICApOiBDb21wbGV0aW9uUGFyYW1zIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIocmVxdWVzdC5lZGl0b3IpLFxyXG4gICAgICBwb3NpdGlvbjogQ29udmVydC5wb2ludFRvUG9zaXRpb24ocmVxdWVzdC5idWZmZXJQb3NpdGlvbiksXHJcbiAgICAgIGNvbnRleHQ6IEF1dG9jb21wbGV0ZUFkYXB0ZXIuY3JlYXRlQ29tcGxldGlvbkNvbnRleHQodHJpZ2dlckNoYXJhY3RlciwgdHJpZ2dlck9ubHkpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIHtDb21wbGV0aW9uQ29udGV4dH0gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gYmFzZWQgb24gdGhlIHRyaWdnZXIgY2hhcmFjdGVyLlxyXG4gIC8vXHJcbiAgLy8gKiBgdHJpZ2dlckNoYXJhY3RlcmAgVGhlIHtzdHJpbmd9IGNvbnRhaW5pbmcgdGhlIHRyaWdnZXIgY2hhcmFjdGVyIG9yICcnIGlmIG5vbmUuXHJcbiAgLy8gKiBgdHJpZ2dlck9ubHlgIEEge2Jvb2xlYW59IHJlcHJlc2VudGluZyB3aGV0aGVyIHRoaXMgY29tcGxldGlvbiBpcyB0cmlnZ2VyZWQgcmlnaHQgYWZ0ZXIgYSB0cmlnZ2VyIGNoYXJhY3Rlci5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYW4ge0NvbXBsZXRpb25Db250ZXh0fSB0aGF0IHNwZWNpZmllcyB0aGUgdHJpZ2dlcktpbmQgYW5kIHRoZSB0cmlnZ2VyQ2hhcmFjdGVyXHJcbiAgLy8gaWYgdGhlcmUgaXMgb25lLlxyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlQ29tcGxldGlvbkNvbnRleHQodHJpZ2dlckNoYXJhY3Rlcjogc3RyaW5nLCB0cmlnZ2VyT25seTogYm9vbGVhbik6IENvbXBsZXRpb25Db250ZXh0IHtcclxuICAgIGlmICh0cmlnZ2VyQ2hhcmFjdGVyID09PSAnJykge1xyXG4gICAgICByZXR1cm4ge3RyaWdnZXJLaW5kOiBDb21wbGV0aW9uVHJpZ2dlcktpbmQuSW52b2tlZH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdHJpZ2dlck9ubHlcclxuICAgICAgICA/IHt0cmlnZ2VyS2luZDogQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJDaGFyYWN0ZXIsIHRyaWdnZXJDaGFyYWN0ZXJ9XHJcbiAgICAgICAgOiB7dHJpZ2dlcktpbmQ6IENvbXBsZXRpb25UcmlnZ2VyS2luZC5UcmlnZ2VyRm9ySW5jb21wbGV0ZUNvbXBsZXRpb25zLCB0cmlnZ2VyQ2hhcmFjdGVyfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBDb21wbGV0aW9uSXRlbSBhcnJheSBvciBDb21wbGV0aW9uTGlzdCB0b1xyXG4gIC8vIGFuIGFycmF5IG9mIG9yZGVyZWQgQXV0b0NvbXBsZXRlKyBzdWdnZXN0aW9ucy5cclxuICAvL1xyXG4gIC8vICogYGNvbXBsZXRpb25JdGVtc2AgQW4ge0FycmF5fSBvZiB7Q29tcGxldGlvbkl0ZW19IG9iamVjdHMgb3IgYSB7Q29tcGxldGlvbkxpc3R9IGNvbnRhaW5pbmcgY29tcGxldGlvblxyXG4gIC8vICAgICAgICAgICBpdGVtcyB0byBiZSBjb252ZXJ0ZWQuXHJcbiAgLy8gKiBgcmVxdWVzdGAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVJlcXVlc3R9IHRvIHNhdGlzZnkuXHJcbiAgLy8gKiBgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW1gIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHtDb21wbGV0aW9uSXRlbX0sIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259XHJcbiAgLy8gICBhbmQgYSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGNvbnZlcnRlZCBpdGVtcy5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7TWFwfSBvZiBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb25zIG9yZGVyZWQgYnkgdGhlIENvbXBsZXRpb25JdGVtcyBzb3J0VGV4dC5cclxuICBwdWJsaWMgY29tcGxldGlvbkl0ZW1zVG9TdWdnZXN0aW9ucyhcclxuICAgIGNvbXBsZXRpb25JdGVtczogQ29tcGxldGlvbkl0ZW1bXSB8IENvbXBsZXRpb25MaXN0LFxyXG4gICAgcmVxdWVzdDogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudCxcclxuICAgIG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtPzogQ29tcGxldGlvbkl0ZW1BZGp1c3RlcixcclxuICApOiBNYXA8YWMuQW55U3VnZ2VzdGlvbiwgUG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtPiB7XHJcbiAgICByZXR1cm4gbmV3IE1hcCgoQXJyYXkuaXNBcnJheShjb21wbGV0aW9uSXRlbXMpID8gY29tcGxldGlvbkl0ZW1zIDogY29tcGxldGlvbkl0ZW1zLml0ZW1zIHx8IFtdKVxyXG4gICAgICAuc29ydCgoYSwgYikgPT4gKGEuc29ydFRleHQgfHwgYS5sYWJlbCkubG9jYWxlQ29tcGFyZShiLnNvcnRUZXh0IHx8IGIubGFiZWwpKVxyXG4gICAgICAubWFwPFthYy5BbnlTdWdnZXN0aW9uLCBQb3NzaWJseVJlc29sdmVkQ29tcGxldGlvbkl0ZW1dPihcclxuICAgICAgICAocykgPT4gW1xyXG4gICAgICAgICAgQXV0b2NvbXBsZXRlQWRhcHRlci5jb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihcclxuICAgICAgICAgICAgcywge30gYXMgYWMuQW55U3VnZ2VzdGlvbiwgcmVxdWVzdCwgb25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0pLFxyXG4gICAgICAgICAgICBuZXcgUG9zc2libHlSZXNvbHZlZENvbXBsZXRpb25JdGVtKHMsIGZhbHNlKV0pKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBDb21wbGV0aW9uSXRlbSB0byBhbiBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb24uXHJcbiAgLy9cclxuICAvLyAqIGBpdGVtYCBBbiB7Q29tcGxldGlvbkl0ZW19IGNvbnRhaW5pbmcgYSBjb21wbGV0aW9uIGl0ZW0gdG8gYmUgY29udmVydGVkLlxyXG4gIC8vICogYHN1Z2dlc3Rpb25gIEEge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gdG8gaGF2ZSB0aGUgY29udmVyc2lvbiBhcHBsaWVkIHRvLlxyXG4gIC8vICogYHJlcXVlc3RgIFRoZSB7YXRvbSRBdXRvY29tcGxldGVSZXF1ZXN0fSB0byBzYXRpc2Z5LlxyXG4gIC8vICogYG9uRGlkQ29udmVydENvbXBsZXRpb25JdGVtYCBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSB7Q29tcGxldGlvbkl0ZW19LCBhbiB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufVxyXG4gIC8vICAgYW5kIGEge2F0b20kQXV0b2NvbXBsZXRlUmVxdWVzdH0gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBjb252ZXJ0ZWQgaXRlbXMuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIHRoZSB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSBwYXNzZWQgaW4gYXMgc3VnZ2VzdGlvbiB3aXRoIHRoZSBjb252ZXJzaW9uIGFwcGxpZWQuXHJcbiAgcHVibGljIHN0YXRpYyBjb21wbGV0aW9uSXRlbVRvU3VnZ2VzdGlvbihcclxuICAgIGl0ZW06IENvbXBsZXRpb25JdGVtLFxyXG4gICAgc3VnZ2VzdGlvbjogYWMuQW55U3VnZ2VzdGlvbixcclxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXHJcbiAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbT86IENvbXBsZXRpb25JdGVtQWRqdXN0ZXIsXHJcbiAgKTogYWMuQW55U3VnZ2VzdGlvbiB7XHJcbiAgICBBdXRvY29tcGxldGVBZGFwdGVyLmFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oaXRlbSwgc3VnZ2VzdGlvbiBhcyBhYy5UZXh0U3VnZ2VzdGlvbik7XHJcbiAgICBBdXRvY29tcGxldGVBZGFwdGVyLmFwcGx5VGV4dEVkaXRUb1N1Z2dlc3Rpb24oaXRlbS50ZXh0RWRpdCwgcmVxdWVzdC5lZGl0b3IsIHN1Z2dlc3Rpb24gYXMgYWMuVGV4dFN1Z2dlc3Rpb24pO1xyXG4gICAgQXV0b2NvbXBsZXRlQWRhcHRlci5hcHBseVNuaXBwZXRUb1N1Z2dlc3Rpb24oaXRlbSwgc3VnZ2VzdGlvbiBhcyBhYy5TbmlwcGV0U3VnZ2VzdGlvbik7XHJcbiAgICBpZiAob25EaWRDb252ZXJ0Q29tcGxldGlvbkl0ZW0gIT0gbnVsbCkge1xyXG4gICAgICBvbkRpZENvbnZlcnRDb21wbGV0aW9uSXRlbShpdGVtLCBzdWdnZXN0aW9uLCByZXF1ZXN0KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gc3VnZ2VzdGlvbjtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCB0aGUgcHJpbWFyeSBwYXJ0cyBvZiBhIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBDb21wbGV0aW9uSXRlbSB0byBhbiBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb24uXHJcbiAgLy9cclxuICAvLyAqIGBpdGVtYCBBbiB7Q29tcGxldGlvbkl0ZW19IGNvbnRhaW5pbmcgdGhlIGNvbXBsZXRpb24gaXRlbXMgdG8gYmUgbWVyZ2VkIGludG8uXHJcbiAgLy8gKiBgc3VnZ2VzdGlvbmAgVGhlIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IHRvIG1lcmdlIHRoZSBjb252ZXJzaW9uIGludG8uXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGFuIHthdG9tJEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb259IGNyZWF0ZWQgZnJvbSB0aGUge0NvbXBsZXRpb25JdGVtfS5cclxuICBwdWJsaWMgc3RhdGljIGFwcGx5Q29tcGxldGlvbkl0ZW1Ub1N1Z2dlc3Rpb24oXHJcbiAgICBpdGVtOiBDb21wbGV0aW9uSXRlbSxcclxuICAgIHN1Z2dlc3Rpb246IGFjLlRleHRTdWdnZXN0aW9uLFxyXG4gICkge1xyXG4gICAgc3VnZ2VzdGlvbi50ZXh0ID0gaXRlbS5pbnNlcnRUZXh0IHx8IGl0ZW0ubGFiZWw7XHJcbiAgICBzdWdnZXN0aW9uLmRpc3BsYXlUZXh0ID0gaXRlbS5sYWJlbDtcclxuICAgIHN1Z2dlc3Rpb24udHlwZSA9IEF1dG9jb21wbGV0ZUFkYXB0ZXIuY29tcGxldGlvbktpbmRUb1N1Z2dlc3Rpb25UeXBlKGl0ZW0ua2luZCk7XHJcbiAgICBzdWdnZXN0aW9uLnJpZ2h0TGFiZWwgPSBpdGVtLmRldGFpbDtcclxuXHJcbiAgICAvLyBPbGRlciBmb3JtYXQsIGNhbid0IGtub3cgd2hhdCBpdCBpcyBzbyBhc3NpZ24gdG8gYm90aCBhbmQgaG9wZSBmb3IgYmVzdFxyXG4gICAgaWYgKHR5cGVvZihpdGVtLmRvY3VtZW50YXRpb24pID09PSAnc3RyaW5nJykge1xyXG4gICAgICBzdWdnZXN0aW9uLmRlc2NyaXB0aW9uTWFya2Rvd24gPSBpdGVtLmRvY3VtZW50YXRpb247XHJcbiAgICAgIHN1Z2dlc3Rpb24uZGVzY3JpcHRpb24gPSBpdGVtLmRvY3VtZW50YXRpb247XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGl0ZW0uZG9jdW1lbnRhdGlvbiAhPSBudWxsICYmIHR5cGVvZihpdGVtLmRvY3VtZW50YXRpb24pID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAvLyBOZXdlciBmb3JtYXQgc3BlY2lmaWVzIHRoZSBraW5kIG9mIGRvY3VtZW50YXRpb24sIGFzc2lnbiBhcHByb3ByaWF0ZWx5XHJcbiAgICAgIGlmIChpdGVtLmRvY3VtZW50YXRpb24ua2luZCA9PT0gJ21hcmtkb3duJykge1xyXG4gICAgICAgIHN1Z2dlc3Rpb24uZGVzY3JpcHRpb25NYXJrZG93biA9IGl0ZW0uZG9jdW1lbnRhdGlvbi52YWx1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzdWdnZXN0aW9uLmRlc2NyaXB0aW9uID0gaXRlbS5kb2N1bWVudGF0aW9uLnZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEFwcGxpZXMgdGhlIHRleHRFZGl0IHBhcnQgb2YgYSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgQ29tcGxldGlvbkl0ZW0gdG8gYW5cclxuICAvLyBBdXRvQ29tcGxldGUrIFN1Z2dlc3Rpb24gdmlhIHRoZSByZXBsYWNlbWVudFByZWZpeCBhbmQgdGV4dCBwcm9wZXJ0aWVzLlxyXG4gIC8vXHJcbiAgLy8gKiBgdGV4dEVkaXRgIEEge1RleHRFZGl0fSBmcm9tIGEgQ29tcGxldGlvbkl0ZW0gdG8gYXBwbHkuXHJcbiAgLy8gKiBgZWRpdG9yYCBBbiBBdG9tIHtUZXh0RWRpdG9yfSB1c2VkIHRvIG9idGFpbiB0aGUgbmVjZXNzYXJ5IHRleHQgcmVwbGFjZW1lbnQuXHJcbiAgLy8gKiBgc3VnZ2VzdGlvbmAgQW4ge2F0b20kQXV0b2NvbXBsZXRlU3VnZ2VzdGlvbn0gdG8gc2V0IHRoZSByZXBsYWNlbWVudFByZWZpeCBhbmQgdGV4dCBwcm9wZXJ0aWVzIG9mLlxyXG4gIHB1YmxpYyBzdGF0aWMgYXBwbHlUZXh0RWRpdFRvU3VnZ2VzdGlvbihcclxuICAgIHRleHRFZGl0OiBUZXh0RWRpdCB8IHVuZGVmaW5lZCxcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIHN1Z2dlc3Rpb246IGFjLlRleHRTdWdnZXN0aW9uLFxyXG4gICk6IHZvaWQge1xyXG4gICAgaWYgKHRleHRFZGl0KSB7XHJcbiAgICAgIHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UodGV4dEVkaXQucmFuZ2UpKTtcclxuICAgICAgc3VnZ2VzdGlvbi50ZXh0ID0gdGV4dEVkaXQubmV3VGV4dDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQWRkcyBhIHNuaXBwZXQgdG8gdGhlIHN1Z2dlc3Rpb24gaWYgdGhlIENvbXBsZXRpb25JdGVtIGNvbnRhaW5zXHJcbiAgLy8gc25pcHBldC1mb3JtYXR0ZWQgdGV4dFxyXG4gIC8vXHJcbiAgLy8gKiBgaXRlbWAgQW4ge0NvbXBsZXRpb25JdGVtfSBjb250YWluaW5nIHRoZSBjb21wbGV0aW9uIGl0ZW1zIHRvIGJlIG1lcmdlZCBpbnRvLlxyXG4gIC8vICogYHN1Z2dlc3Rpb25gIFRoZSB7YXRvbSRBdXRvY29tcGxldGVTdWdnZXN0aW9ufSB0byBtZXJnZSB0aGUgY29udmVyc2lvbiBpbnRvLlxyXG4gIC8vXHJcbiAgcHVibGljIHN0YXRpYyBhcHBseVNuaXBwZXRUb1N1Z2dlc3Rpb24oaXRlbTogQ29tcGxldGlvbkl0ZW0sIHN1Z2dlc3Rpb246IGFjLlNuaXBwZXRTdWdnZXN0aW9uKTogdm9pZCB7XHJcbiAgICBpZiAoaXRlbS5pbnNlcnRUZXh0Rm9ybWF0ID09PSBJbnNlcnRUZXh0Rm9ybWF0LlNuaXBwZXQpIHtcclxuICAgICAgc3VnZ2VzdGlvbi5zbmlwcGV0ID0gaXRlbS50ZXh0RWRpdCAhPSBudWxsID8gaXRlbS50ZXh0RWRpdC5uZXdUZXh0IDogKGl0ZW0uaW5zZXJ0VGV4dCB8fCAnJyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IE9idGFpbiB0aGUgdGV4dHVhbCBzdWdnZXN0aW9uIHR5cGUgcmVxdWlyZWQgYnkgQXV0b0NvbXBsZXRlKyB0aGF0XHJcbiAgLy8gbW9zdCBjbG9zZWx5IG1hcHMgdG8gdGhlIG51bWVyaWMgY29tcGxldGlvbiBraW5kIHN1cHBsaWVzIGJ5IHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXHJcbiAgLy9cclxuICAvLyAqIGBraW5kYCBBIHtOdW1iZXJ9IHRoYXQgcmVwcmVzZW50cyB0aGUgc3VnZ2VzdGlvbiBraW5kIHRvIGJlIGNvbnZlcnRlZC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7U3RyaW5nfSBjb250YWluaW5nIHRoZSBBdXRvQ29tcGxldGUrIHN1Z2dlc3Rpb24gdHlwZSBlcXVpdmFsZW50XHJcbiAgLy8gdG8gdGhlIGdpdmVuIGNvbXBsZXRpb24ga2luZC5cclxuICBwdWJsaWMgc3RhdGljIGNvbXBsZXRpb25LaW5kVG9TdWdnZXN0aW9uVHlwZShraW5kOiBudW1iZXIgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xyXG4gICAgc3dpdGNoIChraW5kKSB7XHJcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkNvbnN0YW50OlxyXG4gICAgICAgIHJldHVybiAnY29uc3RhbnQnO1xyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5NZXRob2Q6XHJcbiAgICAgICAgcmV0dXJuICdtZXRob2QnO1xyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5GdW5jdGlvbjpcclxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuQ29uc3RydWN0b3I6XHJcbiAgICAgICAgcmV0dXJuICdmdW5jdGlvbic7XHJcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkZpZWxkOlxyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5Qcm9wZXJ0eTpcclxuICAgICAgICByZXR1cm4gJ3Byb3BlcnR5JztcclxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuVmFyaWFibGU6XHJcbiAgICAgICAgcmV0dXJuICd2YXJpYWJsZSc7XHJcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkNsYXNzOlxyXG4gICAgICAgIHJldHVybiAnY2xhc3MnO1xyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5TdHJ1Y3Q6XHJcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLlR5cGVQYXJhbWV0ZXI6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlJztcclxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuT3BlcmF0b3I6XHJcbiAgICAgICAgcmV0dXJuICdzZWxlY3Rvcic7XHJcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLkludGVyZmFjZTpcclxuICAgICAgICByZXR1cm4gJ21peGluJztcclxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuTW9kdWxlOlxyXG4gICAgICAgIHJldHVybiAnbW9kdWxlJztcclxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuVW5pdDpcclxuICAgICAgICByZXR1cm4gJ2J1aWx0aW4nO1xyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5FbnVtOlxyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5FbnVtTWVtYmVyOlxyXG4gICAgICAgIHJldHVybiAnZW51bSc7XHJcbiAgICAgIGNhc2UgQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQ6XHJcbiAgICAgICAgcmV0dXJuICdrZXl3b3JkJztcclxuICAgICAgY2FzZSBDb21wbGV0aW9uSXRlbUtpbmQuU25pcHBldDpcclxuICAgICAgICByZXR1cm4gJ3NuaXBwZXQnO1xyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5GaWxlOlxyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5Gb2xkZXI6XHJcbiAgICAgICAgcmV0dXJuICdpbXBvcnQnO1xyXG4gICAgICBjYXNlIENvbXBsZXRpb25JdGVtS2luZC5SZWZlcmVuY2U6XHJcbiAgICAgICAgcmV0dXJuICdyZXF1aXJlJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ3ZhbHVlJztcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/code-action-adapter.js":
/*!************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/code-action-adapter.js ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __webpack_require__(/*! assert */ "assert");
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const apply_edit_adapter_1 = __webpack_require__(/*! ./apply-edit-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter.js");
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
class CodeActionAdapter {
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.codeActionProvider === true;
    }
    // Public: Retrieves code actions for a given editor, range, and context (diagnostics).
    // Throws an error if codeActionProvider is not a registered capability.
    //
    // * `connection` A {LanguageClientConnection} to the language server that provides highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the diagnostics.
    // * `range` The Atom {Range} to fetch code actions for.
    // * `diagnostics` An {Array<atomIde$Diagnostic>} to fetch code actions for.
    //                 This is typically a list of diagnostics intersecting `range`.
    //
    // Returns a {Promise} of an {Array} of {atomIde$CodeAction}s to display.
    static getCodeActions(connection, serverCapabilities, linterAdapter, editor, range, diagnostics) {
        return __awaiter(this, void 0, void 0, function* () {
            if (linterAdapter == null) {
                return [];
            }
            assert(serverCapabilities.codeActionProvider, 'Must have the textDocument/codeAction capability');
            const params = CodeActionAdapter.createCodeActionParams(linterAdapter, editor, range, diagnostics);
            const actions = yield connection.codeAction(params);
            return actions.map((action) => CodeActionAdapter.createCodeAction(action, connection));
        });
    }
    static createCodeAction(action, connection) {
        return {
            apply() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (languageclient_1.CodeAction.is(action)) {
                        CodeActionAdapter.applyWorkspaceEdit(action.edit);
                        yield CodeActionAdapter.executeCommand(action.command, connection);
                    }
                    else {
                        yield CodeActionAdapter.executeCommand(action, connection);
                    }
                });
            },
            getTitle() {
                return Promise.resolve(action.title);
            },
            // tslint:disable-next-line:no-empty
            dispose() { },
        };
    }
    static applyWorkspaceEdit(edit) {
        if (languageclient_1.WorkspaceEdit.is(edit)) {
            apply_edit_adapter_1.default.onApplyEdit({ edit });
        }
    }
    static executeCommand(command, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (languageclient_1.Command.is(command)) {
                yield connection.executeCommand({
                    command: command.command,
                    arguments: command.arguments,
                });
            }
        });
    }
    static createCodeActionParams(linterAdapter, editor, range, diagnostics) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            range: convert_1.default.atomRangeToLSRange(range),
            context: {
                diagnostics: diagnostics.map((diagnostic) => {
                    // Retrieve the stored diagnostic code if it exists.
                    // Until the Linter API provides a place to store the code,
                    // there's no real way for the code actions API to give it back to us.
                    const converted = convert_1.default.atomIdeDiagnosticToLSDiagnostic(diagnostic);
                    if (diagnostic.range != null && diagnostic.text != null) {
                        const code = linterAdapter.getDiagnosticCode(editor, diagnostic.range, diagnostic.text);
                        if (code != null) {
                            converted.code = code;
                        }
                    }
                    return converted;
                }),
            },
        };
    }
}
exports.default = CodeActionAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1hY3Rpb24tYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWFjdGlvbi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFDbEMsd0NBQWlDO0FBQ2pDLDZEQUFvRDtBQUNwRCxzREFPMkI7QUFNM0IsTUFBcUIsaUJBQWlCO0lBQ3BDLGdGQUFnRjtJQUNoRiw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLENBQUM7SUFDeEQsQ0FBQztJQUVELHVGQUF1RjtJQUN2Rix3RUFBd0U7SUFDeEUsRUFBRTtJQUNGLCtGQUErRjtJQUMvRiw0RkFBNEY7SUFDNUYsK0RBQStEO0lBQy9ELHdEQUF3RDtJQUN4RCw0RUFBNEU7SUFDNUUsZ0ZBQWdGO0lBQ2hGLEVBQUU7SUFDRix5RUFBeUU7SUFDbEUsTUFBTSxDQUFPLGNBQWMsQ0FDaEMsVUFBb0MsRUFDcEMsa0JBQXNDLEVBQ3RDLGFBQThDLEVBQzlDLE1BQWtCLEVBQ2xCLEtBQVksRUFDWixXQUFpQzs7WUFFakMsSUFBSSxhQUFhLElBQUksSUFBSSxFQUFFO2dCQUN6QixPQUFPLEVBQUUsQ0FBQzthQUNYO1lBQ0QsTUFBTSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixFQUFFLGtEQUFrRCxDQUFDLENBQUM7WUFFbEcsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbkcsTUFBTSxPQUFPLEdBQUcsTUFBTSxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztLQUFBO0lBRU8sTUFBTSxDQUFDLGdCQUFnQixDQUM3QixNQUE0QixFQUM1QixVQUFvQztRQUVwQyxPQUFPO1lBQ0MsS0FBSzs7b0JBQ1QsSUFBSSwyQkFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDekIsaUJBQWlCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNsRCxNQUFNLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO3FCQUNwRTt5QkFBTTt3QkFDTCxNQUFNLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7cUJBQzVEO2dCQUNILENBQUM7YUFBQTtZQUNELFFBQVE7Z0JBQ04sT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0Qsb0NBQW9DO1lBQ3BDLE9BQU8sS0FBVSxDQUFDO1NBQ25CLENBQUM7SUFDSixDQUFDO0lBRU8sTUFBTSxDQUFDLGtCQUFrQixDQUMvQixJQUErQjtRQUUvQixJQUFJLDhCQUFhLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzFCLDRCQUFnQixDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDeEM7SUFDSCxDQUFDO0lBRU8sTUFBTSxDQUFPLGNBQWMsQ0FDakMsT0FBWSxFQUNaLFVBQW9DOztZQUVwQyxJQUFJLHdCQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUN2QixNQUFNLFVBQVUsQ0FBQyxjQUFjLENBQUM7b0JBQzlCLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTztvQkFDeEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO2lCQUM3QixDQUFDLENBQUM7YUFDSjtRQUNILENBQUM7S0FBQTtJQUVPLE1BQU0sQ0FBQyxzQkFBc0IsQ0FDbkMsYUFBa0MsRUFDbEMsTUFBa0IsRUFDbEIsS0FBWSxFQUNaLFdBQWlDO1FBRWpDLE9BQU87WUFDTCxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUM7WUFDNUQsS0FBSyxFQUFFLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ3hDLE9BQU8sRUFBRTtnQkFDUCxXQUFXLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO29CQUMxQyxvREFBb0Q7b0JBQ3BELDJEQUEyRDtvQkFDM0Qsc0VBQXNFO29CQUN0RSxNQUFNLFNBQVMsR0FBRyxpQkFBTyxDQUFDLCtCQUErQixDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN0RSxJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFO3dCQUN2RCxNQUFNLElBQUksR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUN4RixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7NEJBQ2hCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO3lCQUN2QjtxQkFDRjtvQkFDRCxPQUFPLFNBQVMsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDO2FBQ0g7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBdkdELG9DQXVHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xyXG5pbXBvcnQgTGludGVyUHVzaFYyQWRhcHRlciBmcm9tICcuL2xpbnRlci1wdXNoLXYyLWFkYXB0ZXInO1xyXG5pbXBvcnQgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XHJcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xyXG5pbXBvcnQgQXBwbHlFZGl0QWRhcHRlciBmcm9tICcuL2FwcGx5LWVkaXQtYWRhcHRlcic7XHJcbmltcG9ydCB7XHJcbiAgQ29kZUFjdGlvbixcclxuICBDb2RlQWN0aW9uUGFyYW1zLFxyXG4gIENvbW1hbmQsXHJcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcclxuICBXb3Jrc3BhY2VFZGl0LFxyXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcclxuaW1wb3J0IHtcclxuICBSYW5nZSxcclxuICBUZXh0RWRpdG9yLFxyXG59IGZyb20gJ2F0b20nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29kZUFjdGlvbkFkYXB0ZXIge1xyXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB0aGlzIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXHJcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuY29kZUFjdGlvblByb3ZpZGVyID09PSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBSZXRyaWV2ZXMgY29kZSBhY3Rpb25zIGZvciBhIGdpdmVuIGVkaXRvciwgcmFuZ2UsIGFuZCBjb250ZXh0IChkaWFnbm9zdGljcykuXHJcbiAgLy8gVGhyb3dzIGFuIGVycm9yIGlmIGNvZGVBY3Rpb25Qcm92aWRlciBpcyBub3QgYSByZWdpc3RlcmVkIGNhcGFiaWxpdHkuXHJcbiAgLy9cclxuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCBwcm92aWRlcyBoaWdobGlnaHRzLlxyXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIGJlIHVzZWQuXHJcbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZGlhZ25vc3RpY3MuXHJcbiAgLy8gKiBgcmFuZ2VgIFRoZSBBdG9tIHtSYW5nZX0gdG8gZmV0Y2ggY29kZSBhY3Rpb25zIGZvci5cclxuICAvLyAqIGBkaWFnbm9zdGljc2AgQW4ge0FycmF5PGF0b21JZGUkRGlhZ25vc3RpYz59IHRvIGZldGNoIGNvZGUgYWN0aW9ucyBmb3IuXHJcbiAgLy8gICAgICAgICAgICAgICAgIFRoaXMgaXMgdHlwaWNhbGx5IGEgbGlzdCBvZiBkaWFnbm9zdGljcyBpbnRlcnNlY3RpbmcgYHJhbmdlYC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7YXRvbUlkZSRDb2RlQWN0aW9ufXMgdG8gZGlzcGxheS5cclxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGdldENvZGVBY3Rpb25zKFxyXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gICAgc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMsXHJcbiAgICBsaW50ZXJBZGFwdGVyOiBMaW50ZXJQdXNoVjJBZGFwdGVyIHwgdW5kZWZpbmVkLFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcmFuZ2U6IFJhbmdlLFxyXG4gICAgZGlhZ25vc3RpY3M6IGF0b21JZGUuRGlhZ25vc3RpY1tdLFxyXG4gICk6IFByb21pc2U8YXRvbUlkZS5Db2RlQWN0aW9uW10+IHtcclxuICAgIGlmIChsaW50ZXJBZGFwdGVyID09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgYXNzZXJ0KHNlcnZlckNhcGFiaWxpdGllcy5jb2RlQWN0aW9uUHJvdmlkZXIsICdNdXN0IGhhdmUgdGhlIHRleHREb2N1bWVudC9jb2RlQWN0aW9uIGNhcGFiaWxpdHknKTtcclxuXHJcbiAgICBjb25zdCBwYXJhbXMgPSBDb2RlQWN0aW9uQWRhcHRlci5jcmVhdGVDb2RlQWN0aW9uUGFyYW1zKGxpbnRlckFkYXB0ZXIsIGVkaXRvciwgcmFuZ2UsIGRpYWdub3N0aWNzKTtcclxuICAgIGNvbnN0IGFjdGlvbnMgPSBhd2FpdCBjb25uZWN0aW9uLmNvZGVBY3Rpb24ocGFyYW1zKTtcclxuICAgIHJldHVybiBhY3Rpb25zLm1hcCgoYWN0aW9uKSA9PiBDb2RlQWN0aW9uQWRhcHRlci5jcmVhdGVDb2RlQWN0aW9uKGFjdGlvbiwgY29ubmVjdGlvbikpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlQ29kZUFjdGlvbihcclxuICAgIGFjdGlvbjogQ29tbWFuZCB8IENvZGVBY3Rpb24sXHJcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgKTogYXRvbUlkZS5Db2RlQWN0aW9uIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGFzeW5jIGFwcGx5KCkge1xyXG4gICAgICAgIGlmIChDb2RlQWN0aW9uLmlzKGFjdGlvbikpIHtcclxuICAgICAgICAgIENvZGVBY3Rpb25BZGFwdGVyLmFwcGx5V29ya3NwYWNlRWRpdChhY3Rpb24uZWRpdCk7XHJcbiAgICAgICAgICBhd2FpdCBDb2RlQWN0aW9uQWRhcHRlci5leGVjdXRlQ29tbWFuZChhY3Rpb24uY29tbWFuZCwgY29ubmVjdGlvbik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGF3YWl0IENvZGVBY3Rpb25BZGFwdGVyLmV4ZWN1dGVDb21tYW5kKGFjdGlvbiwgY29ubmVjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBnZXRUaXRsZSgpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWN0aW9uLnRpdGxlKTtcclxuICAgICAgfSxcclxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWVtcHR5XHJcbiAgICAgIGRpc3Bvc2UoKTogdm9pZCB7fSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBhcHBseVdvcmtzcGFjZUVkaXQoXHJcbiAgICBlZGl0OiBXb3Jrc3BhY2VFZGl0IHwgdW5kZWZpbmVkLFxyXG4gICk6IHZvaWQge1xyXG4gICAgaWYgKFdvcmtzcGFjZUVkaXQuaXMoZWRpdCkpIHtcclxuICAgICAgQXBwbHlFZGl0QWRhcHRlci5vbkFwcGx5RWRpdCh7IGVkaXQgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBhc3luYyBleGVjdXRlQ29tbWFuZChcclxuICAgIGNvbW1hbmQ6IGFueSxcclxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmIChDb21tYW5kLmlzKGNvbW1hbmQpKSB7XHJcbiAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZUNvbW1hbmQoe1xyXG4gICAgICAgIGNvbW1hbmQ6IGNvbW1hbmQuY29tbWFuZCxcclxuICAgICAgICBhcmd1bWVudHM6IGNvbW1hbmQuYXJndW1lbnRzLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3RhdGljIGNyZWF0ZUNvZGVBY3Rpb25QYXJhbXMoXHJcbiAgICBsaW50ZXJBZGFwdGVyOiBMaW50ZXJQdXNoVjJBZGFwdGVyLFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcmFuZ2U6IFJhbmdlLFxyXG4gICAgZGlhZ25vc3RpY3M6IGF0b21JZGUuRGlhZ25vc3RpY1tdLFxyXG4gICk6IENvZGVBY3Rpb25QYXJhbXMge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGV4dERvY3VtZW50OiBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50SWRlbnRpZmllcihlZGl0b3IpLFxyXG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UocmFuZ2UpLFxyXG4gICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgZGlhZ25vc3RpY3M6IGRpYWdub3N0aWNzLm1hcCgoZGlhZ25vc3RpYykgPT4ge1xyXG4gICAgICAgICAgLy8gUmV0cmlldmUgdGhlIHN0b3JlZCBkaWFnbm9zdGljIGNvZGUgaWYgaXQgZXhpc3RzLlxyXG4gICAgICAgICAgLy8gVW50aWwgdGhlIExpbnRlciBBUEkgcHJvdmlkZXMgYSBwbGFjZSB0byBzdG9yZSB0aGUgY29kZSxcclxuICAgICAgICAgIC8vIHRoZXJlJ3Mgbm8gcmVhbCB3YXkgZm9yIHRoZSBjb2RlIGFjdGlvbnMgQVBJIHRvIGdpdmUgaXQgYmFjayB0byB1cy5cclxuICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IENvbnZlcnQuYXRvbUlkZURpYWdub3N0aWNUb0xTRGlhZ25vc3RpYyhkaWFnbm9zdGljKTtcclxuICAgICAgICAgIGlmIChkaWFnbm9zdGljLnJhbmdlICE9IG51bGwgJiYgZGlhZ25vc3RpYy50ZXh0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY29uc3QgY29kZSA9IGxpbnRlckFkYXB0ZXIuZ2V0RGlhZ25vc3RpY0NvZGUoZWRpdG9yLCBkaWFnbm9zdGljLnJhbmdlLCBkaWFnbm9zdGljLnRleHQpO1xyXG4gICAgICAgICAgICBpZiAoY29kZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgY29udmVydGVkLmNvZGUgPSBjb2RlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gY29udmVydGVkO1xyXG4gICAgICAgIH0pLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuICB9XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/code-format-adapter.js":
/*!************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/code-format-adapter.js ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
// Public: Adapts the language server protocol "textDocument/completion" to the
// Atom IDE UI Code-format package.
class CodeFormatAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing either a documentFormattingProvider
    // or a documentRangeFormattingProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return (serverCapabilities.documentRangeFormattingProvider === true ||
            serverCapabilities.documentFormattingProvider === true);
    }
    // Public: Format text in the editor using the given language server connection and an optional range.
    // If the server does not support range formatting then range will be ignored and the entire document formatted.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the text that will be formatted.
    // * `range` The optional Atom {Range} containing the subset of the text to be formatted.
    //
    // Returns a {Promise} of an {Array} of {Object}s containing the AutoComplete+
    // suggestions to display.
    static format(connection, serverCapabilities, editor, range) {
        if (serverCapabilities.documentRangeFormattingProvider) {
            return CodeFormatAdapter.formatRange(connection, editor, range);
        }
        if (serverCapabilities.documentFormattingProvider) {
            return CodeFormatAdapter.formatDocument(connection, editor);
        }
        throw new Error('Can not format document, language server does not support it');
    }
    // Public: Format the entire document of an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatDocument(connection, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentFormatting(CodeFormatAdapter.createDocumentFormattingParams(editor));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns {DocumentFormattingParams} containing the identity of the text document as well as
    // options to be used in formatting the document such as tab size and tabs vs spaces.
    static createDocumentFormattingParams(editor) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Format a range within an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `range` The Atom {Range} containing the range of text that should be formatted.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatRange(connection, editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentRangeFormatting(CodeFormatAdapter.createDocumentRangeFormattingParams(editor, range));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentRangeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `range` The Atom {Range} containing the range of text that should be formatted.
    //
    // Returns {DocumentRangeFormattingParams} containing the identity of the text document, the
    // range of the text to be formatted as well as the options to be used in formatting the
    // document such as tab size and tabs vs spaces.
    static createDocumentRangeFormattingParams(editor, range) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            range: convert_1.default.atomRangeToLSRange(range),
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Format on type within an Atom {TextEditor} by using a given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will format the text.
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `point` The {Point} at which the document to be formatted.
    // * `character` A character that triggered formatting request.
    //
    // Returns a {Promise} of an {Array} of {TextEdit} objects that can be applied to the Atom TextEditor
    // to format the document.
    static formatOnType(connection, editor, point, character) {
        return __awaiter(this, void 0, void 0, function* () {
            const edits = yield connection.documentOnTypeFormatting(CodeFormatAdapter.createDocumentOnTypeFormattingParams(editor, point, character));
            return convert_1.default.convertLsTextEdits(edits);
        });
    }
    // Public: Create {DocumentOnTypeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `point` The {Point} at which the document to be formatted.
    // * `character` A character that triggered formatting request.
    //
    // Returns {DocumentOnTypeFormattingParams} containing the identity of the text document, the
    // position of the text to be formatted, the character that triggered formatting request
    // as well as the options to be used in formatting the document such as tab size and tabs vs spaces.
    static createDocumentOnTypeFormattingParams(editor, point, character) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            position: convert_1.default.pointToPosition(point),
            ch: character,
            options: CodeFormatAdapter.getFormatOptions(editor),
        };
    }
    // Public: Create {DocumentRangeFormattingParams} to be sent to the language server when requesting an
    // entire document is formatted.
    //
    // * `editor` The Atom {TextEditor} containing the document to be formatted.
    // * `range` The Atom {Range} containing the range of document that should be formatted.
    //
    // Returns the {FormattingOptions} to be used containing the keys:
    //  * `tabSize` The number of spaces a tab represents.
    //  * `insertSpaces` {True} if spaces should be used, {False} for tab characters.
    static getFormatOptions(editor) {
        return {
            tabSize: editor.getTabLength(),
            insertSpaces: editor.getSoftTabs(),
        };
    }
}
exports.default = CodeFormatAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWZvcm1hdC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQSx3Q0FBaUM7QUFlakMsK0VBQStFO0FBQy9FLG1DQUFtQztBQUNuQyxNQUFxQixpQkFBaUI7SUFDcEMsZ0ZBQWdGO0lBQ2hGLHdGQUF3RjtJQUN4Rix3Q0FBd0M7SUFDeEMsRUFBRTtJQUNGLHNGQUFzRjtJQUN0RixFQUFFO0lBQ0YsZ0ZBQWdGO0lBQ2hGLDRCQUE0QjtJQUNyQixNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLENBQ0wsa0JBQWtCLENBQUMsK0JBQStCLEtBQUssSUFBSTtZQUMzRCxrQkFBa0IsQ0FBQywwQkFBMEIsS0FBSyxJQUFJLENBQ3ZELENBQUM7SUFDSixDQUFDO0lBRUQsc0dBQXNHO0lBQ3RHLGdIQUFnSDtJQUNoSCxFQUFFO0lBQ0YsZ0dBQWdHO0lBQ2hHLDRGQUE0RjtJQUM1RiwrRUFBK0U7SUFDL0UseUZBQXlGO0lBQ3pGLEVBQUU7SUFDRiw4RUFBOEU7SUFDOUUsMEJBQTBCO0lBQ25CLE1BQU0sQ0FBQyxNQUFNLENBQ2xCLFVBQW9DLEVBQ3BDLGtCQUFzQyxFQUN0QyxNQUFrQixFQUNsQixLQUFZO1FBRVosSUFBSSxrQkFBa0IsQ0FBQywrQkFBK0IsRUFBRTtZQUN0RCxPQUFPLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ2pFO1FBRUQsSUFBSSxrQkFBa0IsQ0FBQywwQkFBMEIsRUFBRTtZQUNqRCxPQUFPLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDN0Q7UUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELCtG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Q0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQ3hDLEVBQUUsRUFBRSxTQUFTO1lBQ2IsT0FBTyxFQUFFLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztTQUNwRCxDQUFDO0lBQ0osQ0FBQztJQUVELHNHQUFzRztJQUN0RyxnQ0FBZ0M7SUFDaEMsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSx3RkFBd0Y7SUFDeEYsRUFBRTtJQUNGLGtFQUFrRTtJQUNsRSxzREFBc0Q7SUFDdEQsaUZBQWlGO0lBQzFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFrQjtRQUMvQyxPQUFPO1lBQ0wsT0FBTyxFQUFFLE1BQU0sQ0FBQyxZQUFZLEVBQUU7WUFDOUIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUU7U0FDbkMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTFLRCxvQ0EwS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdG9tSWRlIGZyb20gJ2F0b20taWRlJztcclxuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XHJcbmltcG9ydCB7XHJcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gIERvY3VtZW50Rm9ybWF0dGluZ1BhcmFtcyxcclxuICBEb2N1bWVudFJhbmdlRm9ybWF0dGluZ1BhcmFtcyxcclxuICBEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXMsXHJcbiAgRm9ybWF0dGluZ09wdGlvbnMsXHJcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxyXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcclxuaW1wb3J0IHtcclxuICBUZXh0RWRpdG9yLFxyXG4gIFJhbmdlLFxyXG4gIFBvaW50LFxyXG59IGZyb20gJ2F0b20nO1xyXG5cclxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBcInRleHREb2N1bWVudC9jb21wbGV0aW9uXCIgdG8gdGhlXHJcbi8vIEF0b20gSURFIFVJIENvZGUtZm9ybWF0IHBhY2thZ2UuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvZGVGb3JtYXRBZGFwdGVyIHtcclxuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxyXG4gIC8vIGJhc2VkIG9uIHRoZSBzZXJ2ZXJDYXBhYmlsaXRpZXMgbWF0cml4IGNvbnRhaW5pbmcgZWl0aGVyIGEgZG9jdW1lbnRGb3JtYXR0aW5nUHJvdmlkZXJcclxuICAvLyBvciBhIGRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIuXHJcbiAgLy9cclxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIGNvbnNpZGVyLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIHRoaXMgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcclxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXHJcbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIgPT09IHRydWUgfHxcclxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyID09PSB0cnVlXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBGb3JtYXQgdGV4dCBpbiB0aGUgZWRpdG9yIHVzaW5nIHRoZSBnaXZlbiBsYW5ndWFnZSBzZXJ2ZXIgY29ubmVjdGlvbiBhbmQgYW4gb3B0aW9uYWwgcmFuZ2UuXHJcbiAgLy8gSWYgdGhlIHNlcnZlciBkb2VzIG5vdCBzdXBwb3J0IHJhbmdlIGZvcm1hdHRpbmcgdGhlbiByYW5nZSB3aWxsIGJlIGlnbm9yZWQgYW5kIHRoZSBlbnRpcmUgZG9jdW1lbnQgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXHJcbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgYmUgdXNlZC5cclxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSB0ZXh0IHRoYXQgd2lsbCBiZSBmb3JtYXR0ZWQuXHJcbiAgLy8gKiBgcmFuZ2VgIFRoZSBvcHRpb25hbCBBdG9tIHtSYW5nZX0gY29udGFpbmluZyB0aGUgc3Vic2V0IG9mIHRoZSB0ZXh0IHRvIGJlIGZvcm1hdHRlZC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7T2JqZWN0fXMgY29udGFpbmluZyB0aGUgQXV0b0NvbXBsZXRlK1xyXG4gIC8vIHN1Z2dlc3Rpb25zIHRvIGRpc3BsYXkuXHJcbiAgcHVibGljIHN0YXRpYyBmb3JtYXQoXHJcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgICBzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyxcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIHJhbmdlOiBSYW5nZSxcclxuICApOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xyXG4gICAgaWYgKHNlcnZlckNhcGFiaWxpdGllcy5kb2N1bWVudFJhbmdlRm9ybWF0dGluZ1Byb3ZpZGVyKSB7XHJcbiAgICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXRSYW5nZShjb25uZWN0aW9uLCBlZGl0b3IsIHJhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50Rm9ybWF0dGluZ1Byb3ZpZGVyKSB7XHJcbiAgICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXREb2N1bWVudChjb25uZWN0aW9uLCBlZGl0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG5vdCBmb3JtYXQgZG9jdW1lbnQsIGxhbmd1YWdlIHNlcnZlciBkb2VzIG5vdCBzdXBwb3J0IGl0Jyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEZvcm1hdCB0aGUgZW50aXJlIGRvY3VtZW50IG9mIGFuIEF0b20ge1RleHRFZGl0b3J9IGJ5IHVzaW5nIGEgZ2l2ZW4gbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBmb3JtYXQgdGhlIHRleHQuXHJcbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBvZiBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdH0gb2JqZWN0cyB0aGF0IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBBdG9tIFRleHRFZGl0b3JcclxuICAvLyB0byBmb3JtYXQgdGhlIGRvY3VtZW50LlxyXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgZm9ybWF0RG9jdW1lbnQoXHJcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcclxuICAgIGNvbnN0IGVkaXRzID0gYXdhaXQgY29ubmVjdGlvbi5kb2N1bWVudEZvcm1hdHRpbmcoQ29kZUZvcm1hdEFkYXB0ZXIuY3JlYXRlRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zKGVkaXRvcikpO1xyXG4gICAgcmV0dXJuIENvbnZlcnQuY29udmVydExzVGV4dEVkaXRzKGVkaXRzKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIHtEb2N1bWVudEZvcm1hdHRpbmdQYXJhbXN9IHRvIGJlIHNlbnQgdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB3aGVuIHJlcXVlc3RpbmcgYW5cclxuICAvLyBlbnRpcmUgZG9jdW1lbnQgaXMgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyB7RG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zfSBjb250YWluaW5nIHRoZSBpZGVudGl0eSBvZiB0aGUgdGV4dCBkb2N1bWVudCBhcyB3ZWxsIGFzXHJcbiAgLy8gb3B0aW9ucyB0byBiZSB1c2VkIGluIGZvcm1hdHRpbmcgdGhlIGRvY3VtZW50IHN1Y2ggYXMgdGFiIHNpemUgYW5kIHRhYnMgdnMgc3BhY2VzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRG9jdW1lbnRGb3JtYXR0aW5nUGFyYW1zKGVkaXRvcjogVGV4dEVkaXRvcik6IERvY3VtZW50Rm9ybWF0dGluZ1BhcmFtcyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXHJcbiAgICAgIG9wdGlvbnM6IENvZGVGb3JtYXRBZGFwdGVyLmdldEZvcm1hdE9wdGlvbnMoZWRpdG9yKSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEZvcm1hdCBhIHJhbmdlIHdpdGhpbiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cclxuICAvL1xyXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgZm9ybWF0IHRoZSB0ZXh0LlxyXG4gIC8vICogYHJhbmdlYCBUaGUgQXRvbSB7UmFuZ2V9IGNvbnRhaW5pbmcgdGhlIHJhbmdlIG9mIHRleHQgdGhhdCBzaG91bGQgYmUgZm9ybWF0dGVkLlxyXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9IG9iamVjdHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0byB0aGUgQXRvbSBUZXh0RWRpdG9yXHJcbiAgLy8gdG8gZm9ybWF0IHRoZSBkb2N1bWVudC5cclxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGZvcm1hdFJhbmdlKFxyXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcmFuZ2U6IFJhbmdlLFxyXG4gICk6IFByb21pc2U8YXRvbUlkZS5UZXh0RWRpdFtdPiB7XHJcbiAgICBjb25zdCBlZGl0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRSYW5nZUZvcm1hdHRpbmcoXHJcbiAgICAgIENvZGVGb3JtYXRBZGFwdGVyLmNyZWF0ZURvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zKGVkaXRvciwgcmFuZ2UpLFxyXG4gICAgKTtcclxuICAgIHJldHVybiBDb252ZXJ0LmNvbnZlcnRMc1RleHRFZGl0cyhlZGl0cyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSB7RG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXN9IHRvIGJlIHNlbnQgdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB3aGVuIHJlcXVlc3RpbmcgYW5cclxuICAvLyBlbnRpcmUgZG9jdW1lbnQgaXMgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgZG9jdW1lbnQgdG8gYmUgZm9ybWF0dGVkLlxyXG4gIC8vICogYHJhbmdlYCBUaGUgQXRvbSB7UmFuZ2V9IGNvbnRhaW5pbmcgdGhlIHJhbmdlIG9mIHRleHQgdGhhdCBzaG91bGQgYmUgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyB7RG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIGlkZW50aXR5IG9mIHRoZSB0ZXh0IGRvY3VtZW50LCB0aGVcclxuICAvLyByYW5nZSBvZiB0aGUgdGV4dCB0byBiZSBmb3JtYXR0ZWQgYXMgd2VsbCBhcyB0aGUgb3B0aW9ucyB0byBiZSB1c2VkIGluIGZvcm1hdHRpbmcgdGhlXHJcbiAgLy8gZG9jdW1lbnQgc3VjaCBhcyB0YWIgc2l6ZSBhbmQgdGFicyB2cyBzcGFjZXMuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVEb2N1bWVudFJhbmdlRm9ybWF0dGluZ1BhcmFtcyhcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIHJhbmdlOiBSYW5nZSxcclxuICApOiBEb2N1bWVudFJhbmdlRm9ybWF0dGluZ1BhcmFtcyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXHJcbiAgICAgIHJhbmdlOiBDb252ZXJ0LmF0b21SYW5nZVRvTFNSYW5nZShyYW5nZSksXHJcbiAgICAgIG9wdGlvbnM6IENvZGVGb3JtYXRBZGFwdGVyLmdldEZvcm1hdE9wdGlvbnMoZWRpdG9yKSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEZvcm1hdCBvbiB0eXBlIHdpdGhpbiBhbiBBdG9tIHtUZXh0RWRpdG9yfSBieSB1c2luZyBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cclxuICAvL1xyXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgZm9ybWF0IHRoZSB0ZXh0LlxyXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cclxuICAvLyAqIGBwb2ludGAgVGhlIHtQb2ludH0gYXQgd2hpY2ggdGhlIGRvY3VtZW50IHRvIGJlIGZvcm1hdHRlZC5cclxuICAvLyAqIGBjaGFyYWN0ZXJgIEEgY2hhcmFjdGVyIHRoYXQgdHJpZ2dlcmVkIGZvcm1hdHRpbmcgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gb2YgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9IG9iamVjdHMgdGhhdCBjYW4gYmUgYXBwbGllZCB0byB0aGUgQXRvbSBUZXh0RWRpdG9yXHJcbiAgLy8gdG8gZm9ybWF0IHRoZSBkb2N1bWVudC5cclxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGZvcm1hdE9uVHlwZShcclxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIHBvaW50OiBQb2ludCxcclxuICAgIGNoYXJhY3Rlcjogc3RyaW5nLFxyXG4gICk6IFByb21pc2U8YXRvbUlkZS5UZXh0RWRpdFtdPiB7XHJcbiAgICBjb25zdCBlZGl0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nKFxyXG4gICAgICBDb2RlRm9ybWF0QWRhcHRlci5jcmVhdGVEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXMoZWRpdG9yLCBwb2ludCwgY2hhcmFjdGVyKSxcclxuICAgICk7XHJcbiAgICByZXR1cm4gQ29udmVydC5jb252ZXJ0THNUZXh0RWRpdHMoZWRpdHMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDcmVhdGUge0RvY3VtZW50T25UeXBlRm9ybWF0dGluZ1BhcmFtc30gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHdoZW4gcmVxdWVzdGluZyBhblxyXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXHJcbiAgLy9cclxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXHJcbiAgLy8gKiBgcG9pbnRgIFRoZSB7UG9pbnR9IGF0IHdoaWNoIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXHJcbiAgLy8gKiBgY2hhcmFjdGVyYCBBIGNoYXJhY3RlciB0aGF0IHRyaWdnZXJlZCBmb3JtYXR0aW5nIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIHtEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIGlkZW50aXR5IG9mIHRoZSB0ZXh0IGRvY3VtZW50LCB0aGVcclxuICAvLyBwb3NpdGlvbiBvZiB0aGUgdGV4dCB0byBiZSBmb3JtYXR0ZWQsIHRoZSBjaGFyYWN0ZXIgdGhhdCB0cmlnZ2VyZWQgZm9ybWF0dGluZyByZXF1ZXN0XHJcbiAgLy8gYXMgd2VsbCBhcyB0aGUgb3B0aW9ucyB0byBiZSB1c2VkIGluIGZvcm1hdHRpbmcgdGhlIGRvY3VtZW50IHN1Y2ggYXMgdGFiIHNpemUgYW5kIHRhYnMgdnMgc3BhY2VzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlRG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUGFyYW1zKFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcG9pbnQ6IFBvaW50LFxyXG4gICAgY2hhcmFjdGVyOiBzdHJpbmcsXHJcbiAgKTogRG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUGFyYW1zIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yKSxcclxuICAgICAgcG9zaXRpb246IENvbnZlcnQucG9pbnRUb1Bvc2l0aW9uKHBvaW50KSxcclxuICAgICAgY2g6IGNoYXJhY3RlcixcclxuICAgICAgb3B0aW9uczogQ29kZUZvcm1hdEFkYXB0ZXIuZ2V0Rm9ybWF0T3B0aW9ucyhlZGl0b3IpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIHtEb2N1bWVudFJhbmdlRm9ybWF0dGluZ1BhcmFtc30gdG8gYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHdoZW4gcmVxdWVzdGluZyBhblxyXG4gIC8vIGVudGlyZSBkb2N1bWVudCBpcyBmb3JtYXR0ZWQuXHJcbiAgLy9cclxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQuXHJcbiAgLy8gKiBgcmFuZ2VgIFRoZSBBdG9tIHtSYW5nZX0gY29udGFpbmluZyB0aGUgcmFuZ2Ugb2YgZG9jdW1lbnQgdGhhdCBzaG91bGQgYmUgZm9ybWF0dGVkLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyB0aGUge0Zvcm1hdHRpbmdPcHRpb25zfSB0byBiZSB1c2VkIGNvbnRhaW5pbmcgdGhlIGtleXM6XHJcbiAgLy8gICogYHRhYlNpemVgIFRoZSBudW1iZXIgb2Ygc3BhY2VzIGEgdGFiIHJlcHJlc2VudHMuXHJcbiAgLy8gICogYGluc2VydFNwYWNlc2Age1RydWV9IGlmIHNwYWNlcyBzaG91bGQgYmUgdXNlZCwge0ZhbHNlfSBmb3IgdGFiIGNoYXJhY3RlcnMuXHJcbiAgcHVibGljIHN0YXRpYyBnZXRGb3JtYXRPcHRpb25zKGVkaXRvcjogVGV4dEVkaXRvcik6IEZvcm1hdHRpbmdPcHRpb25zIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRhYlNpemU6IGVkaXRvci5nZXRUYWJMZW5ndGgoKSxcclxuICAgICAgaW5zZXJ0U3BhY2VzOiBlZGl0b3IuZ2V0U29mdFRhYnMoKSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcbiJdfQ==

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/code-highlight-adapter.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/code-highlight-adapter.js ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __webpack_require__(/*! assert */ "assert");
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
class CodeHighlightAdapter {
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.documentHighlightProvider === true;
    }
    // Public: Creates highlight markers for a given editor position.
    // Throws an error if documentHighlightProvider is not a registered capability.
    //
    // * `connection` A {LanguageClientConnection} to the language server that provides highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the text to be highlighted.
    // * `position` The Atom {Point} to fetch highlights for.
    //
    // Returns a {Promise} of an {Array} of {Range}s to be turned into highlights.
    static highlight(connection, serverCapabilities, editor, position) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(serverCapabilities.documentHighlightProvider, 'Must have the documentHighlight capability');
            const highlights = yield connection.documentHighlight(convert_1.default.editorToTextDocumentPositionParams(editor, position));
            return highlights.map((highlight) => {
                return convert_1.default.lsRangeToAtomRange(highlight.range);
            });
        });
    }
}
exports.default = CodeHighlightAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1oaWdobGlnaHQtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWhpZ2hsaWdodC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQ0FBa0M7QUFDbEMsd0NBQWlDO0FBV2pDLE1BQXFCLG9CQUFvQjtJQUN2QyxnRkFBZ0Y7SUFDaEYsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMseUJBQXlCLEtBQUssSUFBSSxDQUFDO0lBQy9ELENBQUM7SUFFRCxpRUFBaUU7SUFDakUsK0VBQStFO0lBQy9FLEVBQUU7SUFDRiwrRkFBK0Y7SUFDL0YsNEZBQTRGO0lBQzVGLDBFQUEwRTtJQUMxRSx5REFBeUQ7SUFDekQsRUFBRTtJQUNGLDhFQUE4RTtJQUN2RSxNQUFNLENBQU8sU0FBUyxDQUMzQixVQUFvQyxFQUNwQyxrQkFBc0MsRUFDdEMsTUFBa0IsRUFDbEIsUUFBZTs7WUFFZixNQUFNLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLEVBQUUsNENBQTRDLENBQUMsQ0FBQztZQUNuRyxNQUFNLFVBQVUsR0FBRyxNQUFNLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBTyxDQUFDLGtDQUFrQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BILE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUNsQyxPQUFPLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUE1QkQsdUNBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xyXG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcclxuaW1wb3J0IHtcclxuICBQb2ludCxcclxuICBUZXh0RWRpdG9yLFxyXG4gIFJhbmdlLFxyXG59IGZyb20gJ2F0b20nO1xyXG5pbXBvcnQge1xyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29kZUhpZ2hsaWdodEFkYXB0ZXIge1xyXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB0aGlzIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXHJcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRIaWdobGlnaHRQcm92aWRlciA9PT0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlcyBoaWdobGlnaHQgbWFya2VycyBmb3IgYSBnaXZlbiBlZGl0b3IgcG9zaXRpb24uXHJcbiAgLy8gVGhyb3dzIGFuIGVycm9yIGlmIGRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXIgaXMgbm90IGEgcmVnaXN0ZXJlZCBjYXBhYmlsaXR5LlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgcHJvdmlkZXMgaGlnaGxpZ2h0cy5cclxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSB1c2VkLlxyXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHRleHQgdG8gYmUgaGlnaGxpZ2h0ZWQuXHJcbiAgLy8gKiBgcG9zaXRpb25gIFRoZSBBdG9tIHtQb2ludH0gdG8gZmV0Y2ggaGlnaGxpZ2h0cyBmb3IuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHtBcnJheX0gb2Yge1JhbmdlfXMgdG8gYmUgdHVybmVkIGludG8gaGlnaGxpZ2h0cy5cclxuICBwdWJsaWMgc3RhdGljIGFzeW5jIGhpZ2hsaWdodChcclxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICAgIHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzLFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcG9zaXRpb246IFBvaW50LFxyXG4gICk6IFByb21pc2U8UmFuZ2VbXSB8IG51bGw+IHtcclxuICAgIGFzc2VydChzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRIaWdobGlnaHRQcm92aWRlciwgJ011c3QgaGF2ZSB0aGUgZG9jdW1lbnRIaWdobGlnaHQgY2FwYWJpbGl0eScpO1xyXG4gICAgY29uc3QgaGlnaGxpZ2h0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRIaWdobGlnaHQoQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKGVkaXRvciwgcG9zaXRpb24pKTtcclxuICAgIHJldHVybiBoaWdobGlnaHRzLm1hcCgoaGlnaGxpZ2h0KSA9PiB7XHJcbiAgICAgIHJldHVybiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZShoaWdobGlnaHQucmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/datatip-adapter.js":
/*!********************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/datatip-adapter.js ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const Utils = __webpack_require__(/*! ../utils */ "./node_modules/atom-languageclient/build/lib/utils.js");
// Public: Adapts the language server protocol "textDocument/hover" to the
// Atom IDE UI Datatip package.
class DatatipAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a hoverProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.hoverProvider === true;
    }
    // Public: Get the Datatip for this {Point} in a {TextEditor} by querying
    // the language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the hover text/datatip.
    // * `editor` The Atom {TextEditor} containing the text the Datatip should relate to.
    // * `point` The Atom {Point} containing the point within the text the Datatip should relate to.
    //
    // Returns a {Promise} containing the {Datatip} to display or {null} if no Datatip is available.
    getDatatip(connection, editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentPositionParams = convert_1.default.editorToTextDocumentPositionParams(editor, point);
            const hover = yield connection.hover(documentPositionParams);
            if (hover == null || DatatipAdapter.isEmptyHover(hover)) {
                return null;
            }
            const range = hover.range == null ? Utils.getWordAtPosition(editor, point) : convert_1.default.lsRangeToAtomRange(hover.range);
            const markedStrings = (Array.isArray(hover.contents) ? hover.contents : [hover.contents]).map((str) => DatatipAdapter.convertMarkedString(editor, str));
            return { range, markedStrings };
        });
    }
    static isEmptyHover(hover) {
        return hover.contents == null ||
            (typeof hover.contents === 'string' && hover.contents.length === 0) ||
            (Array.isArray(hover.contents) &&
                (hover.contents.length === 0 || hover.contents[0] === ""));
    }
    static convertMarkedString(editor, markedString) {
        if (typeof markedString === 'string') {
            return { type: 'markdown', value: markedString };
        }
        if (markedString.kind) {
            return {
                type: 'markdown',
                value: markedString.value,
            };
        }
        // Must check as <{language: string}> to disambiguate between
        // string and the more explicit object type because MarkedString
        // is a union of the two types
        if (markedString.language) {
            return {
                type: 'snippet',
                // TODO: find a better mapping from language -> grammar
                grammar: atom.grammars.grammarForScopeName(`source.${markedString.language}`) || editor.getGrammar(),
                value: markedString.value,
            };
        }
        // Catch-all case
        return { type: 'markdown', value: markedString.toString() };
    }
}
exports.default = DatatipAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YXRpcC1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RhdGF0aXAtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBQ2pDLGtDQUFrQztBQWFsQywwRUFBMEU7QUFDMUUsK0JBQStCO0FBQy9CLE1BQXFCLGNBQWM7SUFDakMsZ0ZBQWdGO0lBQ2hGLHFFQUFxRTtJQUNyRSxFQUFFO0lBQ0Ysc0ZBQXNGO0lBQ3RGLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQztJQUNuRCxDQUFDO0lBRUQseUVBQXlFO0lBQ3pFLHVCQUF1QjtJQUN2QixFQUFFO0lBQ0YsMEZBQTBGO0lBQzFGLDZDQUE2QztJQUM3QyxxRkFBcUY7SUFDckYsZ0dBQWdHO0lBQ2hHLEVBQUU7SUFDRixnR0FBZ0c7SUFDbkYsVUFBVSxDQUNyQixVQUFvQyxFQUNwQyxNQUFrQixFQUNsQixLQUFZOztZQUVaLE1BQU0sc0JBQXNCLEdBQUcsaUJBQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFekYsTUFBTSxLQUFLLEdBQUcsTUFBTSxVQUFVLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDN0QsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLGNBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxNQUFNLEtBQUssR0FDVCxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFekcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUNwRyxjQUFjLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUNoRCxDQUFDO1lBRUYsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0tBQUE7SUFFTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQVk7UUFDdEMsT0FBTyxLQUFLLENBQUMsUUFBUSxJQUFJLElBQUk7WUFDM0IsQ0FBQyxPQUFPLEtBQUssQ0FBQyxRQUFRLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztZQUNuRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztnQkFDNUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFTyxNQUFNLENBQUMsbUJBQW1CLENBQ2hDLE1BQWtCLEVBQ2xCLFlBQTBDO1FBRTFDLElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsQ0FBQztTQUNsRDtRQUVELElBQUssWUFBOEIsQ0FBQyxJQUFJLEVBQUU7WUFDeEMsT0FBTztnQkFDTCxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLO2FBQzFCLENBQUM7U0FDSDtRQUVELDZEQUE2RDtRQUM3RCxnRUFBZ0U7UUFDaEUsOEJBQThCO1FBQzlCLElBQUssWUFBbUMsQ0FBQyxRQUFRLEVBQUU7WUFDakQsT0FBTztnQkFDTCxJQUFJLEVBQUUsU0FBUztnQkFDZix1REFBdUQ7Z0JBQ3ZELE9BQU8sRUFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUMvQixVQUFXLFlBQW1DLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFO2dCQUNyRixLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7YUFDMUIsQ0FBQztTQUNIO1FBRUQsaUJBQWlCO1FBQ2pCLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztJQUM5RCxDQUFDO0NBQ0Y7QUFsRkQsaUNBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XHJcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi91dGlscyc7XHJcbmltcG9ydCB7XHJcbiAgSG92ZXIsXHJcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gIE1hcmt1cENvbnRlbnQsXHJcbiAgTWFya2VkU3RyaW5nLFxyXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcclxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XHJcbmltcG9ydCB7XHJcbiAgUG9pbnQsXHJcbiAgVGV4dEVkaXRvcixcclxufSBmcm9tICdhdG9tJztcclxuXHJcbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wgXCJ0ZXh0RG9jdW1lbnQvaG92ZXJcIiB0byB0aGVcclxuLy8gQXRvbSBJREUgVUkgRGF0YXRpcCBwYWNrYWdlLlxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYXRhdGlwQWRhcHRlciB7XHJcbiAgLy8gUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGFkYXB0ZXIgY2FuIGJlIHVzZWQgdG8gYWRhcHQgYSBsYW5ndWFnZSBzZXJ2ZXJcclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCBjb250YWluaW5nIGEgaG92ZXJQcm92aWRlci5cclxuICAvL1xyXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcclxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXHJcbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5ob3ZlclByb3ZpZGVyID09PSB0cnVlO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBHZXQgdGhlIERhdGF0aXAgZm9yIHRoaXMge1BvaW50fSBpbiBhIHtUZXh0RWRpdG9yfSBieSBxdWVyeWluZ1xyXG4gIC8vIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXHJcbiAgLy9cclxuICAvLyAqIGBjb25uZWN0aW9uYCBBIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIGJlIHF1ZXJpZWRcclxuICAvLyAgICAgICAgICAgICAgICBmb3IgdGhlIGhvdmVyIHRleHQvZGF0YXRpcC5cclxuICAvLyAqIGBlZGl0b3JgIFRoZSBBdG9tIHtUZXh0RWRpdG9yfSBjb250YWluaW5nIHRoZSB0ZXh0IHRoZSBEYXRhdGlwIHNob3VsZCByZWxhdGUgdG8uXHJcbiAgLy8gKiBgcG9pbnRgIFRoZSBBdG9tIHtQb2ludH0gY29udGFpbmluZyB0aGUgcG9pbnQgd2l0aGluIHRoZSB0ZXh0IHRoZSBEYXRhdGlwIHNob3VsZCByZWxhdGUgdG8uXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtEYXRhdGlwfSB0byBkaXNwbGF5IG9yIHtudWxsfSBpZiBubyBEYXRhdGlwIGlzIGF2YWlsYWJsZS5cclxuICBwdWJsaWMgYXN5bmMgZ2V0RGF0YXRpcChcclxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcclxuICAgIHBvaW50OiBQb2ludCxcclxuICApOiBQcm9taXNlPGF0b21JZGUuRGF0YXRpcCB8IG51bGw+IHtcclxuICAgIGNvbnN0IGRvY3VtZW50UG9zaXRpb25QYXJhbXMgPSBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMoZWRpdG9yLCBwb2ludCk7XHJcblxyXG4gICAgY29uc3QgaG92ZXIgPSBhd2FpdCBjb25uZWN0aW9uLmhvdmVyKGRvY3VtZW50UG9zaXRpb25QYXJhbXMpO1xyXG4gICAgaWYgKGhvdmVyID09IG51bGwgfHwgRGF0YXRpcEFkYXB0ZXIuaXNFbXB0eUhvdmVyKGhvdmVyKSkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByYW5nZSA9XHJcbiAgICAgIGhvdmVyLnJhbmdlID09IG51bGwgPyBVdGlscy5nZXRXb3JkQXRQb3NpdGlvbihlZGl0b3IsIHBvaW50KSA6IENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGhvdmVyLnJhbmdlKTtcclxuXHJcbiAgICBjb25zdCBtYXJrZWRTdHJpbmdzID0gKEFycmF5LmlzQXJyYXkoaG92ZXIuY29udGVudHMpID8gaG92ZXIuY29udGVudHMgOiBbaG92ZXIuY29udGVudHNdKS5tYXAoKHN0cikgPT5cclxuICAgICAgRGF0YXRpcEFkYXB0ZXIuY29udmVydE1hcmtlZFN0cmluZyhlZGl0b3IsIHN0ciksXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB7IHJhbmdlLCBtYXJrZWRTdHJpbmdzIH07XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBpc0VtcHR5SG92ZXIoaG92ZXI6IEhvdmVyKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gaG92ZXIuY29udGVudHMgPT0gbnVsbCB8fFxyXG4gICAgICAodHlwZW9mIGhvdmVyLmNvbnRlbnRzID09PSAnc3RyaW5nJyAmJiBob3Zlci5jb250ZW50cy5sZW5ndGggPT09IDApIHx8XHJcbiAgICAgIChBcnJheS5pc0FycmF5KGhvdmVyLmNvbnRlbnRzKSAmJlxyXG4gICAgICAgIChob3Zlci5jb250ZW50cy5sZW5ndGggPT09IDAgfHwgaG92ZXIuY29udGVudHNbMF0gPT09IFwiXCIpKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3RhdGljIGNvbnZlcnRNYXJrZWRTdHJpbmcoXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgICBtYXJrZWRTdHJpbmc6IE1hcmtlZFN0cmluZyB8IE1hcmt1cENvbnRlbnQsXHJcbiAgKTogYXRvbUlkZS5NYXJrZWRTdHJpbmcge1xyXG4gICAgaWYgKHR5cGVvZiBtYXJrZWRTdHJpbmcgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHJldHVybiB7IHR5cGU6ICdtYXJrZG93bicsIHZhbHVlOiBtYXJrZWRTdHJpbmcgfTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoKG1hcmtlZFN0cmluZyBhcyBNYXJrdXBDb250ZW50KS5raW5kKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogJ21hcmtkb3duJyxcclxuICAgICAgICB2YWx1ZTogbWFya2VkU3RyaW5nLnZhbHVlLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE11c3QgY2hlY2sgYXMgPHtsYW5ndWFnZTogc3RyaW5nfT4gdG8gZGlzYW1iaWd1YXRlIGJldHdlZW5cclxuICAgIC8vIHN0cmluZyBhbmQgdGhlIG1vcmUgZXhwbGljaXQgb2JqZWN0IHR5cGUgYmVjYXVzZSBNYXJrZWRTdHJpbmdcclxuICAgIC8vIGlzIGEgdW5pb24gb2YgdGhlIHR3byB0eXBlc1xyXG4gICAgaWYgKChtYXJrZWRTdHJpbmcgYXMge2xhbmd1YWdlOiBzdHJpbmd9KS5sYW5ndWFnZSkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6ICdzbmlwcGV0JyxcclxuICAgICAgICAvLyBUT0RPOiBmaW5kIGEgYmV0dGVyIG1hcHBpbmcgZnJvbSBsYW5ndWFnZSAtPiBncmFtbWFyXHJcbiAgICAgICAgZ3JhbW1hcjpcclxuICAgICAgICAgIGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShcclxuICAgICAgICAgICAgYHNvdXJjZS4keyhtYXJrZWRTdHJpbmcgYXMge2xhbmd1YWdlOiBzdHJpbmd9KS5sYW5ndWFnZX1gKSB8fCBlZGl0b3IuZ2V0R3JhbW1hcigpLFxyXG4gICAgICAgIHZhbHVlOiBtYXJrZWRTdHJpbmcudmFsdWUsXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2F0Y2gtYWxsIGNhc2VcclxuICAgIHJldHVybiB7IHR5cGU6ICdtYXJrZG93bicsIHZhbHVlOiBtYXJrZWRTdHJpbmcudG9TdHJpbmcoKSB9O1xyXG4gIH1cclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/definition-adapter.js":
/*!***********************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/definition-adapter.js ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const Utils = __webpack_require__(/*! ../utils */ "./node_modules/atom-languageclient/build/lib/utils.js");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
// Public: Adapts the language server definition provider to the
// Atom IDE UI Definitions package for 'Go To Definition' functionality.
class DefinitionAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a definitionProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.definitionProvider === true;
    }
    // Public: Get the definitions for a symbol at a given {Point} within a
    // {TextEditor} including optionally highlighting all other references
    // within the document if the langauge server also supports highlighting.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide definitions and highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `languageName` The name of the programming language.
    // * `editor` The Atom {TextEditor} containing the symbol and potential highlights.
    // * `point` The Atom {Point} containing the position of the text that represents the symbol
    //           for which the definition and highlights should be provided.
    //
    // Returns a {Promise} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    getDefinition(connection, serverCapabilities, languageName, editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentPositionParams = convert_1.default.editorToTextDocumentPositionParams(editor, point);
            const definitionLocations = DefinitionAdapter.normalizeLocations(yield connection.gotoDefinition(documentPositionParams));
            if (definitionLocations == null || definitionLocations.length === 0) {
                return null;
            }
            let queryRange;
            if (serverCapabilities.documentHighlightProvider) {
                const highlights = yield connection.documentHighlight(documentPositionParams);
                if (highlights != null && highlights.length > 0) {
                    queryRange = highlights.map((h) => convert_1.default.lsRangeToAtomRange(h.range));
                }
            }
            return {
                queryRange: queryRange || [Utils.getWordAtPosition(editor, point)],
                definitions: DefinitionAdapter.convertLocationsToDefinitions(definitionLocations, languageName),
            };
        });
    }
    // Public: Normalize the locations so a single {Location} becomes an {Array} of just
    // one. The language server protocol return either as the protocol evolved between v1 and v2.
    //
    // * `locationResult` either a single {Location} object or an {Array} of {Locations}
    //
    // Returns an {Array} of {Location}s or {null} if the locationResult was null.
    static normalizeLocations(locationResult) {
        if (locationResult == null) {
            return null;
        }
        return (Array.isArray(locationResult) ? locationResult : [locationResult]).filter((d) => d.range.start != null);
    }
    // Public: Convert an {Array} of {Location} objects into an Array of {Definition}s.
    //
    // * `locations` An {Array} of {Location} objects to be converted.
    // * `languageName` The name of the language these objects are written in.
    //
    // Returns an {Array} of {Definition}s that represented the converted {Location}s.
    static convertLocationsToDefinitions(locations, languageName) {
        return locations.map((d) => ({
            path: convert_1.default.uriToPath(d.uri),
            position: convert_1.default.positionToPoint(d.range.start),
            range: atom_1.Range.fromObject(convert_1.default.lsRangeToAtomRange(d.range)),
            language: languageName,
        }));
    }
}
exports.default = DefinitionAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RlZmluaXRpb24tYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBQ2pDLGtDQUFrQztBQU1sQywrQkFJYztBQUVkLGdFQUFnRTtBQUNoRSx3RUFBd0U7QUFDeEUsTUFBcUIsaUJBQWlCO0lBQ3BDLGdGQUFnRjtJQUNoRiwwRUFBMEU7SUFDMUUsRUFBRTtJQUNGLHNGQUFzRjtJQUN0RixFQUFFO0lBQ0YsMkVBQTJFO0lBQzNFLDRCQUE0QjtJQUNyQixNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLGtCQUFrQixDQUFDLGtCQUFrQixLQUFLLElBQUksQ0FBQztJQUN4RCxDQUFDO0lBRUQsdUVBQXVFO0lBQ3ZFLHNFQUFzRTtJQUN0RSx5RUFBeUU7SUFDekUsRUFBRTtJQUNGLG1IQUFtSDtJQUNuSCw0RkFBNEY7SUFDNUYseURBQXlEO0lBQ3pELG1GQUFtRjtJQUNuRiw0RkFBNEY7SUFDNUYsd0VBQXdFO0lBQ3hFLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ2YsYUFBYSxDQUN4QixVQUFvQyxFQUNwQyxrQkFBc0MsRUFDdEMsWUFBb0IsRUFDcEIsTUFBa0IsRUFDbEIsS0FBWTs7WUFFWixNQUFNLHNCQUFzQixHQUFHLGlCQUFPLENBQUMsa0NBQWtDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsa0JBQWtCLENBQzlELE1BQU0sVUFBVSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUN4RCxDQUFDO1lBQ0YsSUFBSSxtQkFBbUIsSUFBSSxJQUFJLElBQUksbUJBQW1CLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDbkUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELElBQUksVUFBVSxDQUFDO1lBQ2YsSUFBSSxrQkFBa0IsQ0FBQyx5QkFBeUIsRUFBRTtnQkFDaEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxVQUFVLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUMvQyxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDekU7YUFDRjtZQUVELE9BQU87Z0JBQ0wsVUFBVSxFQUFFLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyw2QkFBNkIsQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLENBQUM7YUFDaEcsQ0FBQztRQUNKLENBQUM7S0FBQTtJQUVELG9GQUFvRjtJQUNwRiw2RkFBNkY7SUFDN0YsRUFBRTtJQUNGLG9GQUFvRjtJQUNwRixFQUFFO0lBQ0YsOEVBQThFO0lBQ3ZFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxjQUFxQztRQUNwRSxJQUFJLGNBQWMsSUFBSSxJQUFJLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ2xILENBQUM7SUFFRCxtRkFBbUY7SUFDbkYsRUFBRTtJQUNGLGtFQUFrRTtJQUNsRSwwRUFBMEU7SUFDMUUsRUFBRTtJQUNGLGtGQUFrRjtJQUMzRSxNQUFNLENBQUMsNkJBQTZCLENBQUMsU0FBcUIsRUFBRSxZQUFvQjtRQUNyRixPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0IsSUFBSSxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDOUIsUUFBUSxFQUFFLGlCQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ2hELEtBQUssRUFBRSxZQUFLLENBQUMsVUFBVSxDQUFDLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVELFFBQVEsRUFBRSxZQUFZO1NBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztDQUNGO0FBakZELG9DQWlGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xyXG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xyXG5pbXBvcnQge1xyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBMb2NhdGlvbixcclxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5pbXBvcnQge1xyXG4gIFBvaW50LFxyXG4gIFRleHRFZGl0b3IsXHJcbiAgUmFuZ2UsXHJcbn0gZnJvbSAnYXRvbSc7XHJcblxyXG4vLyBQdWJsaWM6IEFkYXB0cyB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGRlZmluaXRpb24gcHJvdmlkZXIgdG8gdGhlXHJcbi8vIEF0b20gSURFIFVJIERlZmluaXRpb25zIHBhY2thZ2UgZm9yICdHbyBUbyBEZWZpbml0aW9uJyBmdW5jdGlvbmFsaXR5LlxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEZWZpbml0aW9uQWRhcHRlciB7XHJcbiAgLy8gUHVibGljOiBEZXRlcm1pbmUgd2hldGhlciB0aGlzIGFkYXB0ZXIgY2FuIGJlIHVzZWQgdG8gYWRhcHQgYSBsYW5ndWFnZSBzZXJ2ZXJcclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCBjb250YWluaW5nIGEgZGVmaW5pdGlvblByb3ZpZGVyLlxyXG4gIC8vXHJcbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byBjb25zaWRlci5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxyXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cclxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmRlZmluaXRpb25Qcm92aWRlciA9PT0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogR2V0IHRoZSBkZWZpbml0aW9ucyBmb3IgYSBzeW1ib2wgYXQgYSBnaXZlbiB7UG9pbnR9IHdpdGhpbiBhXHJcbiAgLy8ge1RleHRFZGl0b3J9IGluY2x1ZGluZyBvcHRpb25hbGx5IGhpZ2hsaWdodGluZyBhbGwgb3RoZXIgcmVmZXJlbmNlc1xyXG4gIC8vIHdpdGhpbiB0aGUgZG9jdW1lbnQgaWYgdGhlIGxhbmdhdWdlIHNlcnZlciBhbHNvIHN1cHBvcnRzIGhpZ2hsaWdodGluZy5cclxuICAvL1xyXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgcHJvdmlkZSBkZWZpbml0aW9ucyBhbmQgaGlnaGxpZ2h0cy5cclxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSB1c2VkLlxyXG4gIC8vICogYGxhbmd1YWdlTmFtZWAgVGhlIG5hbWUgb2YgdGhlIHByb2dyYW1taW5nIGxhbmd1YWdlLlxyXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHN5bWJvbCBhbmQgcG90ZW50aWFsIGhpZ2hsaWdodHMuXHJcbiAgLy8gKiBgcG9pbnRgIFRoZSBBdG9tIHtQb2ludH0gY29udGFpbmluZyB0aGUgcG9zaXRpb24gb2YgdGhlIHRleHQgdGhhdCByZXByZXNlbnRzIHRoZSBzeW1ib2xcclxuICAvLyAgICAgICAgICAgZm9yIHdoaWNoIHRoZSBkZWZpbml0aW9uIGFuZCBoaWdobGlnaHRzIHNob3VsZCBiZSBwcm92aWRlZC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxyXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cclxuICBwdWJsaWMgYXN5bmMgZ2V0RGVmaW5pdGlvbihcclxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICAgIHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzLFxyXG4gICAgbGFuZ3VhZ2VOYW1lOiBzdHJpbmcsXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgICBwb2ludDogUG9pbnQsXHJcbiAgKTogUHJvbWlzZTxhdG9tSWRlLkRlZmluaXRpb25RdWVyeVJlc3VsdCB8IG51bGw+IHtcclxuICAgIGNvbnN0IGRvY3VtZW50UG9zaXRpb25QYXJhbXMgPSBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMoZWRpdG9yLCBwb2ludCk7XHJcbiAgICBjb25zdCBkZWZpbml0aW9uTG9jYXRpb25zID0gRGVmaW5pdGlvbkFkYXB0ZXIubm9ybWFsaXplTG9jYXRpb25zKFxyXG4gICAgICBhd2FpdCBjb25uZWN0aW9uLmdvdG9EZWZpbml0aW9uKGRvY3VtZW50UG9zaXRpb25QYXJhbXMpLFxyXG4gICAgKTtcclxuICAgIGlmIChkZWZpbml0aW9uTG9jYXRpb25zID09IG51bGwgfHwgZGVmaW5pdGlvbkxvY2F0aW9ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHF1ZXJ5UmFuZ2U7XHJcbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXIpIHtcclxuICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IGF3YWl0IGNvbm5lY3Rpb24uZG9jdW1lbnRIaWdobGlnaHQoZG9jdW1lbnRQb3NpdGlvblBhcmFtcyk7XHJcbiAgICAgIGlmIChoaWdobGlnaHRzICE9IG51bGwgJiYgaGlnaGxpZ2h0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgcXVlcnlSYW5nZSA9IGhpZ2hsaWdodHMubWFwKChoKSA9PiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZShoLnJhbmdlKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBxdWVyeVJhbmdlOiBxdWVyeVJhbmdlIHx8IFtVdGlscy5nZXRXb3JkQXRQb3NpdGlvbihlZGl0b3IsIHBvaW50KV0sXHJcbiAgICAgIGRlZmluaXRpb25zOiBEZWZpbml0aW9uQWRhcHRlci5jb252ZXJ0TG9jYXRpb25zVG9EZWZpbml0aW9ucyhkZWZpbml0aW9uTG9jYXRpb25zLCBsYW5ndWFnZU5hbWUpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogTm9ybWFsaXplIHRoZSBsb2NhdGlvbnMgc28gYSBzaW5nbGUge0xvY2F0aW9ufSBiZWNvbWVzIGFuIHtBcnJheX0gb2YganVzdFxyXG4gIC8vIG9uZS4gVGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCByZXR1cm4gZWl0aGVyIGFzIHRoZSBwcm90b2NvbCBldm9sdmVkIGJldHdlZW4gdjEgYW5kIHYyLlxyXG4gIC8vXHJcbiAgLy8gKiBgbG9jYXRpb25SZXN1bHRgIGVpdGhlciBhIHNpbmdsZSB7TG9jYXRpb259IG9iamVjdCBvciBhbiB7QXJyYXl9IG9mIHtMb2NhdGlvbnN9XHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge0xvY2F0aW9ufXMgb3Ige251bGx9IGlmIHRoZSBsb2NhdGlvblJlc3VsdCB3YXMgbnVsbC5cclxuICBwdWJsaWMgc3RhdGljIG5vcm1hbGl6ZUxvY2F0aW9ucyhsb2NhdGlvblJlc3VsdDogTG9jYXRpb24gfCBMb2NhdGlvbltdKTogTG9jYXRpb25bXSB8IG51bGwge1xyXG4gICAgaWYgKGxvY2F0aW9uUmVzdWx0ID09IG51bGwpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gKEFycmF5LmlzQXJyYXkobG9jYXRpb25SZXN1bHQpID8gbG9jYXRpb25SZXN1bHQgOiBbbG9jYXRpb25SZXN1bHRdKS5maWx0ZXIoKGQpID0+IGQucmFuZ2Uuc3RhcnQgIT0gbnVsbCk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4ge0FycmF5fSBvZiB7TG9jYXRpb259IG9iamVjdHMgaW50byBhbiBBcnJheSBvZiB7RGVmaW5pdGlvbn1zLlxyXG4gIC8vXHJcbiAgLy8gKiBgbG9jYXRpb25zYCBBbiB7QXJyYXl9IG9mIHtMb2NhdGlvbn0gb2JqZWN0cyB0byBiZSBjb252ZXJ0ZWQuXHJcbiAgLy8gKiBgbGFuZ3VhZ2VOYW1lYCBUaGUgbmFtZSBvZiB0aGUgbGFuZ3VhZ2UgdGhlc2Ugb2JqZWN0cyBhcmUgd3JpdHRlbiBpbi5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYW4ge0FycmF5fSBvZiB7RGVmaW5pdGlvbn1zIHRoYXQgcmVwcmVzZW50ZWQgdGhlIGNvbnZlcnRlZCB7TG9jYXRpb259cy5cclxuICBwdWJsaWMgc3RhdGljIGNvbnZlcnRMb2NhdGlvbnNUb0RlZmluaXRpb25zKGxvY2F0aW9uczogTG9jYXRpb25bXSwgbGFuZ3VhZ2VOYW1lOiBzdHJpbmcpOiBhdG9tSWRlLkRlZmluaXRpb25bXSB7XHJcbiAgICByZXR1cm4gbG9jYXRpb25zLm1hcCgoZCkgPT4gKHtcclxuICAgICAgcGF0aDogQ29udmVydC51cmlUb1BhdGgoZC51cmkpLFxyXG4gICAgICBwb3NpdGlvbjogQ29udmVydC5wb3NpdGlvblRvUG9pbnQoZC5yYW5nZS5zdGFydCksXHJcbiAgICAgIHJhbmdlOiBSYW5nZS5mcm9tT2JqZWN0KENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGQucmFuZ2UpKSxcclxuICAgICAgbGFuZ3VhZ2U6IGxhbmd1YWdlTmFtZSxcclxuICAgIH0pKTtcclxuICB9XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/document-sync-adapter.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/document-sync-adapter.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
const apply_edit_adapter_1 = __webpack_require__(/*! ./apply-edit-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter.js");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const Utils = __webpack_require__(/*! ../utils */ "./node_modules/atom-languageclient/build/lib/utils.js");
// Public: Synchronizes the documents between Atom and the language server by notifying
// each end of changes, opening, closing and other events as well as sending and applying
// changes either in whole or in part depending on what the language server supports.
class DocumentSyncAdapter {
    // Public: Create a new {DocumentSyncAdapter} for the given language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server to be kept in sync.
    // * `documentSync` The document syncing options.
    // * `editorSelector` A predicate function that takes a {TextEditor} and returns a {boolean}
    //                    indicating whether this adapter should care about the contents of the editor.
    constructor(_connection, _editorSelector, documentSync, _reportBusyWhile) {
        this._connection = _connection;
        this._editorSelector = _editorSelector;
        this._reportBusyWhile = _reportBusyWhile;
        this._disposable = new atom_1.CompositeDisposable();
        this._editors = new WeakMap();
        this._versions = new Map();
        if (typeof documentSync === 'object') {
            this._documentSync = documentSync;
        }
        else {
            this._documentSync = {
                change: documentSync || languageclient_1.TextDocumentSyncKind.Full,
            };
        }
        this._disposable.add(atom.textEditors.observe(this.observeTextEditor.bind(this)));
    }
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix textDocumentSync capability either being Full or
    // Incremental.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return this.canAdaptV2(serverCapabilities) || this.canAdaptV3(serverCapabilities);
    }
    static canAdaptV2(serverCapabilities) {
        return (serverCapabilities.textDocumentSync === languageclient_1.TextDocumentSyncKind.Incremental ||
            serverCapabilities.textDocumentSync === languageclient_1.TextDocumentSyncKind.Full);
    }
    static canAdaptV3(serverCapabilities) {
        const options = serverCapabilities.textDocumentSync;
        return (options !== null &&
            typeof options === 'object' &&
            (options.change === languageclient_1.TextDocumentSyncKind.Incremental || options.change === languageclient_1.TextDocumentSyncKind.Full));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this._disposable.dispose();
    }
    // Examine a {TextEditor} and decide if we wish to observe it. If so ensure that we stop observing it
    // when it is closed or otherwise destroyed.
    //
    // * `editor` A {TextEditor} to consider for observation.
    observeTextEditor(editor) {
        const listener = editor.observeGrammar((_grammar) => this._handleGrammarChange(editor));
        this._disposable.add(editor.onDidDestroy(() => {
            this._disposable.remove(listener);
            listener.dispose();
        }));
        this._disposable.add(listener);
        if (!this._editors.has(editor) && this._editorSelector(editor)) {
            this._handleNewEditor(editor);
        }
    }
    _handleGrammarChange(editor) {
        const sync = this._editors.get(editor);
        if (sync != null && !this._editorSelector(editor)) {
            this._editors.delete(editor);
            this._disposable.remove(sync);
            sync.didClose();
            sync.dispose();
        }
        else if (sync == null && this._editorSelector(editor)) {
            this._handleNewEditor(editor);
        }
    }
    _handleNewEditor(editor) {
        const sync = new TextEditorSyncAdapter(editor, this._connection, this._documentSync, this._versions, this._reportBusyWhile);
        this._editors.set(editor, sync);
        this._disposable.add(sync);
        this._disposable.add(editor.onDidDestroy(() => {
            const destroyedSync = this._editors.get(editor);
            if (destroyedSync) {
                this._editors.delete(editor);
                this._disposable.remove(destroyedSync);
                destroyedSync.dispose();
            }
        }));
    }
    getEditorSyncAdapter(editor) {
        return this._editors.get(editor);
    }
}
exports.default = DocumentSyncAdapter;
// Public: Keep a single {TextEditor} in sync with a given language server.
class TextEditorSyncAdapter {
    // Public: Create a {TextEditorSyncAdapter} in sync with a given language server.
    //
    // * `editor` A {TextEditor} to keep in sync.
    // * `connection` A {LanguageClientConnection} to a language server to keep in sync.
    // * `documentSync` The document syncing options.
    constructor(_editor, _connection, _documentSync, _versions, _reportBusyWhile) {
        this._editor = _editor;
        this._connection = _connection;
        this._documentSync = _documentSync;
        this._versions = _versions;
        this._reportBusyWhile = _reportBusyWhile;
        this._disposable = new atom_1.CompositeDisposable();
        this._fakeDidChangeWatchedFiles = atom.project.onDidChangeFiles == null;
        const changeTracking = this.setupChangeTracking(_documentSync);
        if (changeTracking != null) {
            this._disposable.add(changeTracking);
        }
        // These handlers are attached only if server supports them
        if (_documentSync.willSave) {
            this._disposable.add(_editor.getBuffer().onWillSave(this.willSave.bind(this)));
        }
        if (_documentSync.willSaveWaitUntil) {
            this._disposable.add(_editor.getBuffer().onWillSave(this.willSaveWaitUntil.bind(this)));
        }
        // Send close notifications unless it's explicitly disabled
        if (_documentSync.openClose !== false) {
            this._disposable.add(_editor.onDidDestroy(this.didClose.bind(this)));
        }
        this._disposable.add(_editor.onDidSave(this.didSave.bind(this)), _editor.onDidChangePath(this.didRename.bind(this)));
        this._currentUri = this.getEditorUri();
        if (_documentSync.openClose !== false) {
            this.didOpen();
        }
    }
    // The change tracking disposable listener that will ensure that changes are sent to the
    // language server as appropriate.
    setupChangeTracking(documentSync) {
        switch (documentSync.change) {
            case languageclient_1.TextDocumentSyncKind.Full:
                return this._editor.onDidChange(this.sendFullChanges.bind(this));
            case languageclient_1.TextDocumentSyncKind.Incremental:
                return this._editor.getBuffer().onDidChangeText(this.sendIncrementalChanges.bind(this));
        }
        return null;
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this._disposable.dispose();
    }
    // Get the languageId field that will be sent to the language server by simply
    // using the grammar name.
    getLanguageId() {
        return this._editor.getGrammar().name;
    }
    // Public: Create a {VersionedTextDocumentIdentifier} for the document observed by
    // this adapter including both the Uri and the current Version.
    getVersionedTextDocumentIdentifier() {
        return {
            uri: this.getEditorUri(),
            version: this._getVersion(this._editor.getPath() || ''),
        };
    }
    // Public: Send the entire document to the language server. This is used when
    // operating in Full (1) sync mode.
    sendFullChanges() {
        if (!this._isPrimaryAdapter()) {
            return;
        } // Multiple editors, we are not first
        this._bumpVersion();
        this._connection.didChangeTextDocument({
            textDocument: this.getVersionedTextDocumentIdentifier(),
            contentChanges: [{ text: this._editor.getText() }],
        });
    }
    // Public: Send the incremental text changes to the language server. This is used
    // when operating in Incremental (2) sync mode.
    //
    // * `event` The event fired by Atom to indicate the document has stopped changing
    //           including a list of changes since the last time this event fired for this
    //           text editor.
    // Note: The order of changes in the event is guaranteed top to bottom.  Language server
    // expects this in reverse.
    sendIncrementalChanges(event) {
        if (event.changes.length > 0) {
            if (!this._isPrimaryAdapter()) {
                return;
            } // Multiple editors, we are not first
            this._bumpVersion();
            this._connection.didChangeTextDocument({
                textDocument: this.getVersionedTextDocumentIdentifier(),
                contentChanges: event.changes.map(TextEditorSyncAdapter.textEditToContentChange).reverse(),
            });
        }
    }
    // Public: Convert an Atom {TextEditEvent} to a language server {TextDocumentContentChangeEvent}
    // object.
    //
    // * `change` The Atom {TextEditEvent} to convert.
    //
    // Returns a {TextDocumentContentChangeEvent} that represents the converted {TextEditEvent}.
    static textEditToContentChange(change) {
        return {
            range: convert_1.default.atomRangeToLSRange(change.oldRange),
            rangeLength: change.oldText.length,
            text: change.newText,
        };
    }
    _isPrimaryAdapter() {
        const lowestIdForBuffer = Math.min(...atom.workspace
            .getTextEditors()
            .filter((t) => t.getBuffer() === this._editor.getBuffer())
            .map((t) => t.id));
        return lowestIdForBuffer === this._editor.id;
    }
    _bumpVersion() {
        const filePath = this._editor.getPath();
        if (filePath == null) {
            return;
        }
        this._versions.set(filePath, this._getVersion(filePath) + 1);
    }
    // Ensure when the document is opened we send notification to the language server
    // so it can load it in and keep track of diagnostics etc.
    didOpen() {
        const filePath = this._editor.getPath();
        if (filePath == null) {
            return;
        } // Not yet saved
        if (!this._isPrimaryAdapter()) {
            return;
        } // Multiple editors, we are not first
        this._connection.didOpenTextDocument({
            textDocument: {
                uri: this.getEditorUri(),
                languageId: this.getLanguageId().toLowerCase(),
                version: this._getVersion(filePath),
                text: this._editor.getText(),
            },
        });
    }
    _getVersion(filePath) {
        return this._versions.get(filePath) || 1;
    }
    // Called when the {TextEditor} is closed and sends the 'didCloseTextDocument' notification to
    // the connected language server.
    didClose() {
        if (this._editor.getPath() == null) {
            return;
        } // Not yet saved
        const fileStillOpen = atom.workspace.getTextEditors().find((t) => t.getBuffer() === this._editor.getBuffer());
        if (fileStillOpen) {
            return; // Other windows or editors still have this file open
        }
        this._connection.didCloseTextDocument({ textDocument: { uri: this.getEditorUri() } });
    }
    // Called just before the {TextEditor} saves and sends the 'willSaveTextDocument' notification to
    // the connected language server.
    willSave() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const uri = this.getEditorUri();
        this._connection.willSaveTextDocument({
            textDocument: { uri },
            reason: languageclient_1.TextDocumentSaveReason.Manual,
        });
    }
    // Called just before the {TextEditor} saves, sends the 'willSaveWaitUntilTextDocument' request to
    // the connected language server and waits for the response before saving the buffer.
    willSaveWaitUntil() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._isPrimaryAdapter()) {
                return Promise.resolve();
            }
            const buffer = this._editor.getBuffer();
            const uri = this.getEditorUri();
            const title = this._editor.getLongTitle();
            const applyEditsOrTimeout = Utils.promiseWithTimeout(2500, // 2.5 seconds timeout
            this._connection.willSaveWaitUntilTextDocument({
                textDocument: { uri },
                reason: languageclient_1.TextDocumentSaveReason.Manual,
            })).then((edits) => {
                const cursor = this._editor.getCursorBufferPosition();
                apply_edit_adapter_1.default.applyEdits(buffer, convert_1.default.convertLsTextEdits(edits));
                this._editor.setCursorBufferPosition(cursor);
            }).catch((err) => {
                atom.notifications.addError('On-save action failed', {
                    description: `Failed to apply edits to ${title}`,
                    detail: err.message,
                });
                return;
            });
            const withBusySignal = this._reportBusyWhile(`Applying on-save edits for ${title}`, () => applyEditsOrTimeout);
            return withBusySignal || applyEditsOrTimeout;
        });
    }
    // Called when the {TextEditor} saves and sends the 'didSaveTextDocument' notification to
    // the connected language server.
    // Note: Right now this also sends the `didChangeWatchedFiles` notification as well but that
    // will be sent from elsewhere soon.
    didSave() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const uri = this.getEditorUri();
        const didSaveNotification = {
            textDocument: { uri, version: this._getVersion((uri)) },
        };
        if (this._documentSync.save && this._documentSync.save.includeText) {
            didSaveNotification.text = this._editor.getText();
        }
        this._connection.didSaveTextDocument(didSaveNotification);
        if (this._fakeDidChangeWatchedFiles) {
            this._connection.didChangeWatchedFiles({
                changes: [{ uri, type: languageclient_1.FileChangeType.Changed }],
            });
        }
    }
    didRename() {
        if (!this._isPrimaryAdapter()) {
            return;
        }
        const oldUri = this._currentUri;
        this._currentUri = this.getEditorUri();
        if (!oldUri) {
            return; // Didn't previously have a name
        }
        if (this._documentSync.openClose !== false) {
            this._connection.didCloseTextDocument({ textDocument: { uri: oldUri } });
        }
        if (this._fakeDidChangeWatchedFiles) {
            this._connection.didChangeWatchedFiles({
                changes: [{ uri: oldUri, type: languageclient_1.FileChangeType.Deleted }, { uri: this._currentUri, type: languageclient_1.FileChangeType.Created }],
            });
        }
        // Send an equivalent open event for this editor, which will now use the new
        // file path.
        if (this._documentSync.openClose !== false) {
            this.didOpen();
        }
    }
    // Public: Obtain the current {TextEditor} path and convert it to a Uri.
    getEditorUri() {
        return convert_1.default.pathToUri(this._editor.getPath() || '');
    }
}
exports.TextEditorSyncAdapter = TextEditorSyncAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnQtc3luYy1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsd0NBQWlDO0FBQ2pDLHNEQVUyQjtBQUMzQiw2REFBb0Q7QUFDcEQsK0JBTWM7QUFDZCxrQ0FBa0M7QUFFbEMsdUZBQXVGO0FBQ3ZGLHlGQUF5RjtBQUN6RixxRkFBcUY7QUFDckYsTUFBcUIsbUJBQW1CO0lBa0N0Qyw0RUFBNEU7SUFDNUUsRUFBRTtJQUNGLHlGQUF5RjtJQUN6RixpREFBaUQ7SUFDakQsNEZBQTRGO0lBQzVGLG1HQUFtRztJQUNuRyxZQUNVLFdBQXFDLEVBQ3JDLGVBQWdELEVBQ3hELFlBQXdFLEVBQ2hFLGdCQUF1QztRQUh2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBMEI7UUFDckMsb0JBQWUsR0FBZixlQUFlLENBQWlDO1FBRWhELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBdUI7UUEzQ3pDLGdCQUFXLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBRXhDLGFBQVEsR0FBK0MsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUNyRSxjQUFTLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUM7UUEwQ2pELElBQUksT0FBTyxZQUFZLEtBQUssUUFBUSxFQUFFO1lBQ3BDLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1NBQ25DO2FBQU07WUFDTCxJQUFJLENBQUMsYUFBYSxHQUFHO2dCQUNuQixNQUFNLEVBQUUsWUFBWSxJQUFJLHFDQUFvQixDQUFDLElBQUk7YUFDbEQsQ0FBQztTQUNIO1FBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7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SUFFRCx3RUFBd0U7SUFDakUsWUFBWTtRQUNqQixPQUFPLGlCQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekQsQ0FBQztDQUNGO0FBblJELHNEQW1SQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xyXG5pbXBvcnQge1xyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBGaWxlQ2hhbmdlVHlwZSxcclxuICBUZXh0RG9jdW1lbnRTYXZlUmVhc29uLFxyXG4gIFRleHREb2N1bWVudFN5bmNLaW5kLFxyXG4gIFRleHREb2N1bWVudFN5bmNPcHRpb25zLFxyXG4gIFRleHREb2N1bWVudENvbnRlbnRDaGFuZ2VFdmVudCxcclxuICBWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyLFxyXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcclxuICBEaWRTYXZlVGV4dERvY3VtZW50UGFyYW1zLFxyXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcclxuaW1wb3J0IEFwcGx5RWRpdEFkYXB0ZXIgZnJvbSAnLi9hcHBseS1lZGl0LWFkYXB0ZXInO1xyXG5pbXBvcnQge1xyXG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXHJcbiAgRGlzcG9zYWJsZSxcclxuICBUZXh0RWRpdG9yLFxyXG4gIEJ1ZmZlclN0b3BwZWRDaGFuZ2luZ0V2ZW50LFxyXG4gIFRleHRDaGFuZ2UsXHJcbn0gZnJvbSAnYXRvbSc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL3V0aWxzJztcclxuXHJcbi8vIFB1YmxpYzogU3luY2hyb25pemVzIHRoZSBkb2N1bWVudHMgYmV0d2VlbiBBdG9tIGFuZCB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGJ5IG5vdGlmeWluZ1xyXG4vLyBlYWNoIGVuZCBvZiBjaGFuZ2VzLCBvcGVuaW5nLCBjbG9zaW5nIGFuZCBvdGhlciBldmVudHMgYXMgd2VsbCBhcyBzZW5kaW5nIGFuZCBhcHBseWluZ1xyXG4vLyBjaGFuZ2VzIGVpdGhlciBpbiB3aG9sZSBvciBpbiBwYXJ0IGRlcGVuZGluZyBvbiB3aGF0IHRoZSBsYW5ndWFnZSBzZXJ2ZXIgc3VwcG9ydHMuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERvY3VtZW50U3luY0FkYXB0ZXIge1xyXG4gIHByaXZhdGUgX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gIHB1YmxpYyBfZG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucztcclxuICBwcml2YXRlIF9lZGl0b3JzOiBXZWFrTWFwPFRleHRFZGl0b3IsIFRleHRFZGl0b3JTeW5jQWRhcHRlcj4gPSBuZXcgV2Vha01hcCgpO1xyXG4gIHByaXZhdGUgX3ZlcnNpb25zOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxyXG4gIC8vIGJhc2VkIG9uIHRoZSBzZXJ2ZXJDYXBhYmlsaXRpZXMgbWF0cml4IHRleHREb2N1bWVudFN5bmMgY2FwYWJpbGl0eSBlaXRoZXIgYmVpbmcgRnVsbCBvclxyXG4gIC8vIEluY3JlbWVudGFsLlxyXG4gIC8vXHJcbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byBjb25zaWRlci5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxyXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cclxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5jYW5BZGFwdFYyKHNlcnZlckNhcGFiaWxpdGllcykgfHwgdGhpcy5jYW5BZGFwdFYzKHNlcnZlckNhcGFiaWxpdGllcyk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBjYW5BZGFwdFYyKHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBzZXJ2ZXJDYXBhYmlsaXRpZXMudGV4dERvY3VtZW50U3luYyA9PT0gVGV4dERvY3VtZW50U3luY0tpbmQuSW5jcmVtZW50YWwgfHxcclxuICAgICAgc2VydmVyQ2FwYWJpbGl0aWVzLnRleHREb2N1bWVudFN5bmMgPT09IFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGxcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHN0YXRpYyBjYW5BZGFwdFYzKHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBvcHRpb25zID0gc2VydmVyQ2FwYWJpbGl0aWVzLnRleHREb2N1bWVudFN5bmM7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICBvcHRpb25zICE9PSBudWxsICYmXHJcbiAgICAgIHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0JyAmJlxyXG4gICAgICAob3B0aW9ucy5jaGFuZ2UgPT09IFRleHREb2N1bWVudFN5bmNLaW5kLkluY3JlbWVudGFsIHx8IG9wdGlvbnMuY2hhbmdlID09PSBUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEgbmV3IHtEb2N1bWVudFN5bmNBZGFwdGVyfSBmb3IgdGhlIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cclxuICAvL1xyXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0byBiZSBrZXB0IGluIHN5bmMuXHJcbiAgLy8gKiBgZG9jdW1lbnRTeW5jYCBUaGUgZG9jdW1lbnQgc3luY2luZyBvcHRpb25zLlxyXG4gIC8vICogYGVkaXRvclNlbGVjdG9yYCBBIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IHRha2VzIGEge1RleHRFZGl0b3J9IGFuZCByZXR1cm5zIGEge2Jvb2xlYW59XHJcbiAgLy8gICAgICAgICAgICAgICAgICAgIGluZGljYXRpbmcgd2hldGhlciB0aGlzIGFkYXB0ZXIgc2hvdWxkIGNhcmUgYWJvdXQgdGhlIGNvbnRlbnRzIG9mIHRoZSBlZGl0b3IuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIF9jb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgICBwcml2YXRlIF9lZGl0b3JTZWxlY3RvcjogKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gYm9vbGVhbixcclxuICAgIGRvY3VtZW50U3luYzogVGV4dERvY3VtZW50U3luY09wdGlvbnMgfCBUZXh0RG9jdW1lbnRTeW5jS2luZCB8IHVuZGVmaW5lZCxcclxuICAgIHByaXZhdGUgX3JlcG9ydEJ1c3lXaGlsZTogVXRpbHMuUmVwb3J0QnVzeVdoaWxlLFxyXG4gICkge1xyXG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudFN5bmMgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMuX2RvY3VtZW50U3luYyA9IGRvY3VtZW50U3luYztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuX2RvY3VtZW50U3luYyA9IHtcclxuICAgICAgICBjaGFuZ2U6IGRvY3VtZW50U3luYyB8fCBUZXh0RG9jdW1lbnRTeW5jS2luZC5GdWxsLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS50ZXh0RWRpdG9ycy5vYnNlcnZlKHRoaXMub2JzZXJ2ZVRleHRFZGl0b3IuYmluZCh0aGlzKSkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRGlzcG9zZSB0aGlzIGFkYXB0ZXIgZW5zdXJpbmcgYW55IHJlc291cmNlcyBhcmUgZnJlZWQgYW5kIGV2ZW50cyB1bmhvb2tlZC5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gRXhhbWluZSBhIHtUZXh0RWRpdG9yfSBhbmQgZGVjaWRlIGlmIHdlIHdpc2ggdG8gb2JzZXJ2ZSBpdC4gSWYgc28gZW5zdXJlIHRoYXQgd2Ugc3RvcCBvYnNlcnZpbmcgaXRcclxuICAvLyB3aGVuIGl0IGlzIGNsb3NlZCBvciBvdGhlcndpc2UgZGVzdHJveWVkLlxyXG4gIC8vXHJcbiAgLy8gKiBgZWRpdG9yYCBBIHtUZXh0RWRpdG9yfSB0byBjb25zaWRlciBmb3Igb2JzZXJ2YXRpb24uXHJcbiAgcHVibGljIG9ic2VydmVUZXh0RWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IHZvaWQge1xyXG4gICAgY29uc3QgbGlzdGVuZXIgPSBlZGl0b3Iub2JzZXJ2ZUdyYW1tYXIoKF9ncmFtbWFyKSA9PiB0aGlzLl9oYW5kbGVHcmFtbWFyQ2hhbmdlKGVkaXRvcikpO1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKGxpc3RlbmVyKTtcclxuICAgICAgICBsaXN0ZW5lci5kaXNwb3NlKCk7XHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGxpc3RlbmVyKTtcclxuICAgIGlmICghdGhpcy5fZWRpdG9ycy5oYXMoZWRpdG9yKSAmJiB0aGlzLl9lZGl0b3JTZWxlY3RvcihlZGl0b3IpKSB7XHJcbiAgICAgIHRoaXMuX2hhbmRsZU5ld0VkaXRvcihlZGl0b3IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfaGFuZGxlR3JhbW1hckNoYW5nZShlZGl0b3I6IFRleHRFZGl0b3IpOiB2b2lkIHtcclxuICAgIGNvbnN0IHN5bmMgPSB0aGlzLl9lZGl0b3JzLmdldChlZGl0b3IpO1xyXG4gICAgaWYgKHN5bmMgIT0gbnVsbCAmJiAhdGhpcy5fZWRpdG9yU2VsZWN0b3IoZWRpdG9yKSkge1xyXG4gICAgICB0aGlzLl9lZGl0b3JzLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZShzeW5jKTtcclxuICAgICAgc3luYy5kaWRDbG9zZSgpO1xyXG4gICAgICBzeW5jLmRpc3Bvc2UoKTtcclxuICAgIH0gZWxzZSBpZiAoc3luYyA9PSBudWxsICYmIHRoaXMuX2VkaXRvclNlbGVjdG9yKGVkaXRvcikpIHtcclxuICAgICAgdGhpcy5faGFuZGxlTmV3RWRpdG9yKGVkaXRvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVOZXdFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yKTogdm9pZCB7XHJcbiAgICBjb25zdCBzeW5jID0gbmV3IFRleHRFZGl0b3JTeW5jQWRhcHRlcihcclxuICAgICAgZWRpdG9yLFxyXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLFxyXG4gICAgICB0aGlzLl9kb2N1bWVudFN5bmMsXHJcbiAgICAgIHRoaXMuX3ZlcnNpb25zLFxyXG4gICAgICB0aGlzLl9yZXBvcnRCdXN5V2hpbGUsXHJcbiAgICApO1xyXG4gICAgdGhpcy5fZWRpdG9ycy5zZXQoZWRpdG9yLCBzeW5jKTtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHN5bmMpO1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGRlc3Ryb3llZFN5bmMgPSB0aGlzLl9lZGl0b3JzLmdldChlZGl0b3IpO1xyXG4gICAgICAgIGlmIChkZXN0cm95ZWRTeW5jKSB7XHJcbiAgICAgICAgICB0aGlzLl9lZGl0b3JzLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoZGVzdHJveWVkU3luYyk7XHJcbiAgICAgICAgICBkZXN0cm95ZWRTeW5jLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRFZGl0b3JTeW5jQWRhcHRlcihlZGl0b3I6IFRleHRFZGl0b3IpOiBUZXh0RWRpdG9yU3luY0FkYXB0ZXIgfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIHRoaXMuX2VkaXRvcnMuZ2V0KGVkaXRvcik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBQdWJsaWM6IEtlZXAgYSBzaW5nbGUge1RleHRFZGl0b3J9IGluIHN5bmMgd2l0aCBhIGdpdmVuIGxhbmd1YWdlIHNlcnZlci5cclxuZXhwb3J0IGNsYXNzIFRleHRFZGl0b3JTeW5jQWRhcHRlciB7XHJcbiAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgcHJpdmF0ZSBfY3VycmVudFVyaTogc3RyaW5nO1xyXG4gIHByaXZhdGUgX2Zha2VEaWRDaGFuZ2VXYXRjaGVkRmlsZXM6IGJvb2xlYW47XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1RleHRFZGl0b3JTeW5jQWRhcHRlcn0gaW4gc3luYyB3aXRoIGEgZ2l2ZW4gbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIC8vXHJcbiAgLy8gKiBgZWRpdG9yYCBBIHtUZXh0RWRpdG9yfSB0byBrZWVwIGluIHN5bmMuXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byBhIGxhbmd1YWdlIHNlcnZlciB0byBrZWVwIGluIHN5bmMuXHJcbiAgLy8gKiBgZG9jdW1lbnRTeW5jYCBUaGUgZG9jdW1lbnQgc3luY2luZyBvcHRpb25zLlxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcHJpdmF0ZSBfY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gICAgcHJpdmF0ZSBfZG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyxcclxuICAgIHByaXZhdGUgX3ZlcnNpb25zOiBNYXA8c3RyaW5nLCBudW1iZXI+LFxyXG4gICAgcHJpdmF0ZSBfcmVwb3J0QnVzeVdoaWxlOiBVdGlscy5SZXBvcnRCdXN5V2hpbGUsXHJcbiAgKSB7XHJcbiAgICB0aGlzLl9mYWtlRGlkQ2hhbmdlV2F0Y2hlZEZpbGVzID0gYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlRmlsZXMgPT0gbnVsbDtcclxuXHJcbiAgICBjb25zdCBjaGFuZ2VUcmFja2luZyA9IHRoaXMuc2V0dXBDaGFuZ2VUcmFja2luZyhfZG9jdW1lbnRTeW5jKTtcclxuICAgIGlmIChjaGFuZ2VUcmFja2luZyAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGNoYW5nZVRyYWNraW5nKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUaGVzZSBoYW5kbGVycyBhcmUgYXR0YWNoZWQgb25seSBpZiBzZXJ2ZXIgc3VwcG9ydHMgdGhlbVxyXG4gICAgaWYgKF9kb2N1bWVudFN5bmMud2lsbFNhdmUpIHtcclxuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX2VkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxTYXZlKHRoaXMud2lsbFNhdmUuYmluZCh0aGlzKSkpO1xyXG4gICAgfVxyXG4gICAgaWYgKF9kb2N1bWVudFN5bmMud2lsbFNhdmVXYWl0VW50aWwpIHtcclxuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX2VkaXRvci5nZXRCdWZmZXIoKS5vbldpbGxTYXZlKHRoaXMud2lsbFNhdmVXYWl0VW50aWwuYmluZCh0aGlzKSkpO1xyXG4gICAgfVxyXG4gICAgLy8gU2VuZCBjbG9zZSBub3RpZmljYXRpb25zIHVubGVzcyBpdCdzIGV4cGxpY2l0bHkgZGlzYWJsZWRcclxuICAgIGlmIChfZG9jdW1lbnRTeW5jLm9wZW5DbG9zZSAhPT0gZmFsc2UpIHtcclxuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX2VkaXRvci5vbkRpZERlc3Ryb3kodGhpcy5kaWRDbG9zZS5iaW5kKHRoaXMpKSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChcclxuICAgICAgX2VkaXRvci5vbkRpZFNhdmUodGhpcy5kaWRTYXZlLmJpbmQodGhpcykpLFxyXG4gICAgICBfZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCh0aGlzLmRpZFJlbmFtZS5iaW5kKHRoaXMpKSxcclxuICAgICk7XHJcblxyXG4gICAgdGhpcy5fY3VycmVudFVyaSA9IHRoaXMuZ2V0RWRpdG9yVXJpKCk7XHJcblxyXG4gICAgaWYgKF9kb2N1bWVudFN5bmMub3BlbkNsb3NlICE9PSBmYWxzZSkge1xyXG4gICAgICB0aGlzLmRpZE9wZW4oKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFRoZSBjaGFuZ2UgdHJhY2tpbmcgZGlzcG9zYWJsZSBsaXN0ZW5lciB0aGF0IHdpbGwgZW5zdXJlIHRoYXQgY2hhbmdlcyBhcmUgc2VudCB0byB0aGVcclxuICAvLyBsYW5ndWFnZSBzZXJ2ZXIgYXMgYXBwcm9wcmlhdGUuXHJcbiAgcHVibGljIHNldHVwQ2hhbmdlVHJhY2tpbmcoZG9jdW1lbnRTeW5jOiBUZXh0RG9jdW1lbnRTeW5jT3B0aW9ucyk6IERpc3Bvc2FibGUgfCBudWxsIHtcclxuICAgIHN3aXRjaCAoZG9jdW1lbnRTeW5jLmNoYW5nZSkge1xyXG4gICAgICBjYXNlIFRleHREb2N1bWVudFN5bmNLaW5kLkZ1bGw6XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VkaXRvci5vbkRpZENoYW5nZSh0aGlzLnNlbmRGdWxsQ2hhbmdlcy5iaW5kKHRoaXMpKTtcclxuICAgICAgY2FzZSBUZXh0RG9jdW1lbnRTeW5jS2luZC5JbmNyZW1lbnRhbDpcclxuICAgICAgICByZXR1cm4gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlVGV4dCh0aGlzLnNlbmRJbmNyZW1lbnRhbENoYW5nZXMuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcblxyXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIC8vIEdldCB0aGUgbGFuZ3VhZ2VJZCBmaWVsZCB0aGF0IHdpbGwgYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGJ5IHNpbXBseVxyXG4gIC8vIHVzaW5nIHRoZSBncmFtbWFyIG5hbWUuXHJcbiAgcHVibGljIGdldExhbmd1YWdlSWQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0R3JhbW1hcigpLm5hbWU7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIHtWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyfSBmb3IgdGhlIGRvY3VtZW50IG9ic2VydmVkIGJ5XHJcbiAgLy8gdGhpcyBhZGFwdGVyIGluY2x1ZGluZyBib3RoIHRoZSBVcmkgYW5kIHRoZSBjdXJyZW50IFZlcnNpb24uXHJcbiAgcHVibGljIGdldFZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXIoKTogVmVyc2lvbmVkVGV4dERvY3VtZW50SWRlbnRpZmllciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB1cmk6IHRoaXMuZ2V0RWRpdG9yVXJpKCksXHJcbiAgICAgIHZlcnNpb246IHRoaXMuX2dldFZlcnNpb24odGhpcy5fZWRpdG9yLmdldFBhdGgoKSB8fCAnJyksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIHRoZSBlbnRpcmUgZG9jdW1lbnQgdG8gdGhlIGxhbmd1YWdlIHNlcnZlci4gVGhpcyBpcyB1c2VkIHdoZW5cclxuICAvLyBvcGVyYXRpbmcgaW4gRnVsbCAoMSkgc3luYyBtb2RlLlxyXG4gIHB1YmxpYyBzZW5kRnVsbENoYW5nZXMoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuX2lzUHJpbWFyeUFkYXB0ZXIoKSkgeyByZXR1cm47IH0gLy8gTXVsdGlwbGUgZWRpdG9ycywgd2UgYXJlIG5vdCBmaXJzdFxyXG5cclxuICAgIHRoaXMuX2J1bXBWZXJzaW9uKCk7XHJcbiAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVRleHREb2N1bWVudCh7XHJcbiAgICAgIHRleHREb2N1bWVudDogdGhpcy5nZXRWZXJzaW9uZWRUZXh0RG9jdW1lbnRJZGVudGlmaWVyKCksXHJcbiAgICAgIGNvbnRlbnRDaGFuZ2VzOiBbe3RleHQ6IHRoaXMuX2VkaXRvci5nZXRUZXh0KCl9XSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIHRoZSBpbmNyZW1lbnRhbCB0ZXh0IGNoYW5nZXMgdG8gdGhlIGxhbmd1YWdlIHNlcnZlci4gVGhpcyBpcyB1c2VkXHJcbiAgLy8gd2hlbiBvcGVyYXRpbmcgaW4gSW5jcmVtZW50YWwgKDIpIHN5bmMgbW9kZS5cclxuICAvL1xyXG4gIC8vICogYGV2ZW50YCBUaGUgZXZlbnQgZmlyZWQgYnkgQXRvbSB0byBpbmRpY2F0ZSB0aGUgZG9jdW1lbnQgaGFzIHN0b3BwZWQgY2hhbmdpbmdcclxuICAvLyAgICAgICAgICAgaW5jbHVkaW5nIGEgbGlzdCBvZiBjaGFuZ2VzIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhpcyBldmVudCBmaXJlZCBmb3IgdGhpc1xyXG4gIC8vICAgICAgICAgICB0ZXh0IGVkaXRvci5cclxuICAvLyBOb3RlOiBUaGUgb3JkZXIgb2YgY2hhbmdlcyBpbiB0aGUgZXZlbnQgaXMgZ3VhcmFudGVlZCB0b3AgdG8gYm90dG9tLiAgTGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gZXhwZWN0cyB0aGlzIGluIHJldmVyc2UuXHJcbiAgcHVibGljIHNlbmRJbmNyZW1lbnRhbENoYW5nZXMoZXZlbnQ6IEJ1ZmZlclN0b3BwZWRDaGFuZ2luZ0V2ZW50KTogdm9pZCB7XHJcbiAgICBpZiAoZXZlbnQuY2hhbmdlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfSAvLyBNdWx0aXBsZSBlZGl0b3JzLCB3ZSBhcmUgbm90IGZpcnN0XHJcblxyXG4gICAgICB0aGlzLl9idW1wVmVyc2lvbigpO1xyXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVRleHREb2N1bWVudCh7XHJcbiAgICAgICAgdGV4dERvY3VtZW50OiB0aGlzLmdldFZlcnNpb25lZFRleHREb2N1bWVudElkZW50aWZpZXIoKSxcclxuICAgICAgICBjb250ZW50Q2hhbmdlczogZXZlbnQuY2hhbmdlcy5tYXAoVGV4dEVkaXRvclN5bmNBZGFwdGVyLnRleHRFZGl0VG9Db250ZW50Q2hhbmdlKS5yZXZlcnNlKCksXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIEF0b20ge1RleHRFZGl0RXZlbnR9IHRvIGEgbGFuZ3VhZ2Ugc2VydmVyIHtUZXh0RG9jdW1lbnRDb250ZW50Q2hhbmdlRXZlbnR9XHJcbiAgLy8gb2JqZWN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgY2hhbmdlYCBUaGUgQXRvbSB7VGV4dEVkaXRFdmVudH0gdG8gY29udmVydC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7VGV4dERvY3VtZW50Q29udGVudENoYW5nZUV2ZW50fSB0aGF0IHJlcHJlc2VudHMgdGhlIGNvbnZlcnRlZCB7VGV4dEVkaXRFdmVudH0uXHJcbiAgcHVibGljIHN0YXRpYyB0ZXh0RWRpdFRvQ29udGVudENoYW5nZShjaGFuZ2U6IFRleHRDaGFuZ2UpOiBUZXh0RG9jdW1lbnRDb250ZW50Q2hhbmdlRXZlbnQge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmFuZ2U6IENvbnZlcnQuYXRvbVJhbmdlVG9MU1JhbmdlKGNoYW5nZS5vbGRSYW5nZSksXHJcbiAgICAgIHJhbmdlTGVuZ3RoOiBjaGFuZ2Uub2xkVGV4dC5sZW5ndGgsXHJcbiAgICAgIHRleHQ6IGNoYW5nZS5uZXdUZXh0LFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2lzUHJpbWFyeUFkYXB0ZXIoKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBsb3dlc3RJZEZvckJ1ZmZlciA9IE1hdGgubWluKFxyXG4gICAgICAuLi5hdG9tLndvcmtzcGFjZVxyXG4gICAgICAgIC5nZXRUZXh0RWRpdG9ycygpXHJcbiAgICAgICAgLmZpbHRlcigodCkgPT4gdC5nZXRCdWZmZXIoKSA9PT0gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpKVxyXG4gICAgICAgIC5tYXAoKHQpID0+IHQuaWQpLFxyXG4gICAgKTtcclxuICAgIHJldHVybiBsb3dlc3RJZEZvckJ1ZmZlciA9PT0gdGhpcy5fZWRpdG9yLmlkO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfYnVtcFZlcnNpb24oKTogdm9pZCB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuX2VkaXRvci5nZXRQYXRoKCk7XHJcbiAgICBpZiAoZmlsZVBhdGggPT0gbnVsbCkgeyByZXR1cm47IH1cclxuICAgIHRoaXMuX3ZlcnNpb25zLnNldChmaWxlUGF0aCwgdGhpcy5fZ2V0VmVyc2lvbihmaWxlUGF0aCkgKyAxKTtcclxuICB9XHJcblxyXG4gIC8vIEVuc3VyZSB3aGVuIHRoZSBkb2N1bWVudCBpcyBvcGVuZWQgd2Ugc2VuZCBub3RpZmljYXRpb24gdG8gdGhlIGxhbmd1YWdlIHNlcnZlclxyXG4gIC8vIHNvIGl0IGNhbiBsb2FkIGl0IGluIGFuZCBrZWVwIHRyYWNrIG9mIGRpYWdub3N0aWNzIGV0Yy5cclxuICBwcml2YXRlIGRpZE9wZW4oKTogdm9pZCB7XHJcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMuX2VkaXRvci5nZXRQYXRoKCk7XHJcbiAgICBpZiAoZmlsZVBhdGggPT0gbnVsbCkgeyByZXR1cm47IH0gLy8gTm90IHlldCBzYXZlZFxyXG5cclxuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfSAvLyBNdWx0aXBsZSBlZGl0b3JzLCB3ZSBhcmUgbm90IGZpcnN0XHJcblxyXG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaWRPcGVuVGV4dERvY3VtZW50KHtcclxuICAgICAgdGV4dERvY3VtZW50OiB7XHJcbiAgICAgICAgdXJpOiB0aGlzLmdldEVkaXRvclVyaSgpLFxyXG4gICAgICAgIGxhbmd1YWdlSWQ6IHRoaXMuZ2V0TGFuZ3VhZ2VJZCgpLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgdmVyc2lvbjogdGhpcy5fZ2V0VmVyc2lvbihmaWxlUGF0aCksXHJcbiAgICAgICAgdGV4dDogdGhpcy5fZWRpdG9yLmdldFRleHQoKSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfZ2V0VmVyc2lvbihmaWxlUGF0aDogc3RyaW5nKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLl92ZXJzaW9ucy5nZXQoZmlsZVBhdGgpIHx8IDE7XHJcbiAgfVxyXG5cclxuICAvLyBDYWxsZWQgd2hlbiB0aGUge1RleHRFZGl0b3J9IGlzIGNsb3NlZCBhbmQgc2VuZHMgdGhlICdkaWRDbG9zZVRleHREb2N1bWVudCcgbm90aWZpY2F0aW9uIHRvXHJcbiAgLy8gdGhlIGNvbm5lY3RlZCBsYW5ndWFnZSBzZXJ2ZXIuXHJcbiAgcHVibGljIGRpZENsb3NlKCk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2VkaXRvci5nZXRQYXRoKCkgPT0gbnVsbCkgeyByZXR1cm47IH0gLy8gTm90IHlldCBzYXZlZFxyXG5cclxuICAgIGNvbnN0IGZpbGVTdGlsbE9wZW4gPSBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpLmZpbmQoKHQpID0+IHQuZ2V0QnVmZmVyKCkgPT09IHRoaXMuX2VkaXRvci5nZXRCdWZmZXIoKSk7XHJcbiAgICBpZiAoZmlsZVN0aWxsT3Blbikge1xyXG4gICAgICByZXR1cm47IC8vIE90aGVyIHdpbmRvd3Mgb3IgZWRpdG9ycyBzdGlsbCBoYXZlIHRoaXMgZmlsZSBvcGVuXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fY29ubmVjdGlvbi5kaWRDbG9zZVRleHREb2N1bWVudCh7dGV4dERvY3VtZW50OiB7dXJpOiB0aGlzLmdldEVkaXRvclVyaSgpfX0pO1xyXG4gIH1cclxuXHJcbiAgLy8gQ2FsbGVkIGp1c3QgYmVmb3JlIHRoZSB7VGV4dEVkaXRvcn0gc2F2ZXMgYW5kIHNlbmRzIHRoZSAnd2lsbFNhdmVUZXh0RG9jdW1lbnQnIG5vdGlmaWNhdGlvbiB0b1xyXG4gIC8vIHRoZSBjb25uZWN0ZWQgbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIHB1YmxpYyB3aWxsU2F2ZSgpOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5faXNQcmltYXJ5QWRhcHRlcigpKSB7IHJldHVybjsgfVxyXG5cclxuICAgIGNvbnN0IHVyaSA9IHRoaXMuZ2V0RWRpdG9yVXJpKCk7XHJcbiAgICB0aGlzLl9jb25uZWN0aW9uLndpbGxTYXZlVGV4dERvY3VtZW50KHtcclxuICAgICAgdGV4dERvY3VtZW50OiB7dXJpfSxcclxuICAgICAgcmVhc29uOiBUZXh0RG9jdW1lbnRTYXZlUmVhc29uLk1hbnVhbCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gQ2FsbGVkIGp1c3QgYmVmb3JlIHRoZSB7VGV4dEVkaXRvcn0gc2F2ZXMsIHNlbmRzIHRoZSAnd2lsbFNhdmVXYWl0VW50aWxUZXh0RG9jdW1lbnQnIHJlcXVlc3QgdG9cclxuICAvLyB0aGUgY29ubmVjdGVkIGxhbmd1YWdlIHNlcnZlciBhbmQgd2FpdHMgZm9yIHRoZSByZXNwb25zZSBiZWZvcmUgc2F2aW5nIHRoZSBidWZmZXIuXHJcbiAgcHVibGljIGFzeW5jIHdpbGxTYXZlV2FpdFVudGlsKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCF0aGlzLl9pc1ByaW1hcnlBZGFwdGVyKCkpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpOyB9XHJcblxyXG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpO1xyXG4gICAgY29uc3QgdXJpID0gdGhpcy5nZXRFZGl0b3JVcmkoKTtcclxuICAgIGNvbnN0IHRpdGxlID0gdGhpcy5fZWRpdG9yLmdldExvbmdUaXRsZSgpO1xyXG5cclxuICAgIGNvbnN0IGFwcGx5RWRpdHNPclRpbWVvdXQgPSBVdGlscy5wcm9taXNlV2l0aFRpbWVvdXQoXHJcbiAgICAgIDI1MDAsIC8vIDIuNSBzZWNvbmRzIHRpbWVvdXRcclxuICAgICAgdGhpcy5fY29ubmVjdGlvbi53aWxsU2F2ZVdhaXRVbnRpbFRleHREb2N1bWVudCh7XHJcbiAgICAgICAgdGV4dERvY3VtZW50OiB7dXJpfSxcclxuICAgICAgICByZWFzb246IFRleHREb2N1bWVudFNhdmVSZWFzb24uTWFudWFsLFxyXG4gICAgICB9KSxcclxuICAgICkudGhlbigoZWRpdHMpID0+IHtcclxuICAgICAgY29uc3QgY3Vyc29yID0gdGhpcy5fZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XHJcbiAgICAgIEFwcGx5RWRpdEFkYXB0ZXIuYXBwbHlFZGl0cyhidWZmZXIsIENvbnZlcnQuY29udmVydExzVGV4dEVkaXRzKGVkaXRzKSk7XHJcbiAgICAgIHRoaXMuX2VkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihjdXJzb3IpO1xyXG4gICAgfSkuY2F0Y2goKGVycikgPT4ge1xyXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ09uLXNhdmUgYWN0aW9uIGZhaWxlZCcsIHtcclxuICAgICAgICBkZXNjcmlwdGlvbjogYEZhaWxlZCB0byBhcHBseSBlZGl0cyB0byAke3RpdGxlfWAsXHJcbiAgICAgICAgZGV0YWlsOiBlcnIubWVzc2FnZSxcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHdpdGhCdXN5U2lnbmFsID1cclxuICAgICAgdGhpcy5fcmVwb3J0QnVzeVdoaWxlKFxyXG4gICAgICAgIGBBcHBseWluZyBvbi1zYXZlIGVkaXRzIGZvciAke3RpdGxlfWAsXHJcbiAgICAgICAgKCkgPT4gYXBwbHlFZGl0c09yVGltZW91dCxcclxuICAgICAgKTtcclxuICAgIHJldHVybiB3aXRoQnVzeVNpZ25hbCB8fCBhcHBseUVkaXRzT3JUaW1lb3V0O1xyXG4gIH1cclxuXHJcbiAgLy8gQ2FsbGVkIHdoZW4gdGhlIHtUZXh0RWRpdG9yfSBzYXZlcyBhbmQgc2VuZHMgdGhlICdkaWRTYXZlVGV4dERvY3VtZW50JyBub3RpZmljYXRpb24gdG9cclxuICAvLyB0aGUgY29ubmVjdGVkIGxhbmd1YWdlIHNlcnZlci5cclxuICAvLyBOb3RlOiBSaWdodCBub3cgdGhpcyBhbHNvIHNlbmRzIHRoZSBgZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzYCBub3RpZmljYXRpb24gYXMgd2VsbCBidXQgdGhhdFxyXG4gIC8vIHdpbGwgYmUgc2VudCBmcm9tIGVsc2V3aGVyZSBzb29uLlxyXG4gIHB1YmxpYyBkaWRTYXZlKCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLl9pc1ByaW1hcnlBZGFwdGVyKCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgY29uc3QgdXJpID0gdGhpcy5nZXRFZGl0b3JVcmkoKTtcclxuICAgIGNvbnN0IGRpZFNhdmVOb3RpZmljYXRpb24gPSB7XHJcbiAgICAgIHRleHREb2N1bWVudDoge3VyaSwgdmVyc2lvbjogdGhpcy5fZ2V0VmVyc2lvbigodXJpKSl9LFxyXG4gICAgfSBhcyBEaWRTYXZlVGV4dERvY3VtZW50UGFyYW1zO1xyXG4gICAgaWYgKHRoaXMuX2RvY3VtZW50U3luYy5zYXZlICYmIHRoaXMuX2RvY3VtZW50U3luYy5zYXZlLmluY2x1ZGVUZXh0KSB7XHJcbiAgICAgIGRpZFNhdmVOb3RpZmljYXRpb24udGV4dCA9IHRoaXMuX2VkaXRvci5nZXRUZXh0KCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9jb25uZWN0aW9uLmRpZFNhdmVUZXh0RG9jdW1lbnQoZGlkU2F2ZU5vdGlmaWNhdGlvbik7XHJcbiAgICBpZiAodGhpcy5fZmFrZURpZENoYW5nZVdhdGNoZWRGaWxlcykge1xyXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVdhdGNoZWRGaWxlcyh7XHJcbiAgICAgICAgY2hhbmdlczogW3t1cmksIHR5cGU6IEZpbGVDaGFuZ2VUeXBlLkNoYW5nZWR9XSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlkUmVuYW1lKCk6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLl9pc1ByaW1hcnlBZGFwdGVyKCkpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgY29uc3Qgb2xkVXJpID0gdGhpcy5fY3VycmVudFVyaTtcclxuICAgIHRoaXMuX2N1cnJlbnRVcmkgPSB0aGlzLmdldEVkaXRvclVyaSgpO1xyXG4gICAgaWYgKCFvbGRVcmkpIHtcclxuICAgICAgcmV0dXJuOyAvLyBEaWRuJ3QgcHJldmlvdXNseSBoYXZlIGEgbmFtZVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLl9kb2N1bWVudFN5bmMub3BlbkNsb3NlICE9PSBmYWxzZSkge1xyXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENsb3NlVGV4dERvY3VtZW50KHt0ZXh0RG9jdW1lbnQ6IHt1cmk6IG9sZFVyaX19KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5fZmFrZURpZENoYW5nZVdhdGNoZWRGaWxlcykge1xyXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmRpZENoYW5nZVdhdGNoZWRGaWxlcyh7XHJcbiAgICAgICAgY2hhbmdlczogW3t1cmk6IG9sZFVyaSwgdHlwZTogRmlsZUNoYW5nZVR5cGUuRGVsZXRlZH0sIHt1cmk6IHRoaXMuX2N1cnJlbnRVcmksIHR5cGU6IEZpbGVDaGFuZ2VUeXBlLkNyZWF0ZWR9XSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2VuZCBhbiBlcXVpdmFsZW50IG9wZW4gZXZlbnQgZm9yIHRoaXMgZWRpdG9yLCB3aGljaCB3aWxsIG5vdyB1c2UgdGhlIG5ld1xyXG4gICAgLy8gZmlsZSBwYXRoLlxyXG4gICAgaWYgKHRoaXMuX2RvY3VtZW50U3luYy5vcGVuQ2xvc2UgIT09IGZhbHNlKSB7XHJcbiAgICAgIHRoaXMuZGlkT3BlbigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBPYnRhaW4gdGhlIGN1cnJlbnQge1RleHRFZGl0b3J9IHBhdGggYW5kIGNvbnZlcnQgaXQgdG8gYSBVcmkuXHJcbiAgcHVibGljIGdldEVkaXRvclVyaSgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIENvbnZlcnQucGF0aFRvVXJpKHRoaXMuX2VkaXRvci5nZXRQYXRoKCkgfHwgJycpO1xyXG4gIH1cclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/find-references-adapter.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/find-references-adapter.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
// Public: Adapts the language server definition provider to the
// Atom IDE UI Definitions package for 'Go To Definition' functionality.
class FindReferencesAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a referencesProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.referencesProvider === true;
    }
    // Public: Get the references for a specific symbol within the document as represented by
    // the {TextEditor} and {Point} within it via the language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the references.
    // * `editor` The Atom {TextEditor} containing the text the references should relate to.
    // * `point` The Atom {Point} containing the point within the text the references should relate to.
    //
    // Returns a {Promise} containing a {FindReferencesReturn} with all the references the language server
    // could find.
    getReferences(connection, editor, point, projectRoot) {
        return __awaiter(this, void 0, void 0, function* () {
            const locations = yield connection.findReferences(FindReferencesAdapter.createReferenceParams(editor, point));
            if (locations == null) {
                return null;
            }
            const references = locations.map(FindReferencesAdapter.locationToReference);
            return {
                type: 'data',
                baseUri: projectRoot || '',
                referencedSymbolName: FindReferencesAdapter.getReferencedSymbolName(editor, point, references),
                references,
            };
        });
    }
    // Public: Create a {ReferenceParams} from a given {TextEditor} for a specific {Point}.
    //
    // * `editor` A {TextEditor} that represents the document.
    // * `point` A {Point} within the document.
    //
    // Returns a {ReferenceParams} built from the given parameters.
    static createReferenceParams(editor, point) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            position: convert_1.default.pointToPosition(point),
            context: { includeDeclaration: true },
        };
    }
    // Public: Convert a {Location} into a {Reference}.
    //
    // * `location` A {Location} to convert.
    //
    // Returns a {Reference} equivalent to the given {Location}.
    static locationToReference(location) {
        return {
            uri: convert_1.default.uriToPath(location.uri),
            name: null,
            range: convert_1.default.lsRangeToAtomRange(location.range),
        };
    }
    // Public: Get a symbol name from a {TextEditor} for a specific {Point} in the document.
    static getReferencedSymbolName(editor, point, references) {
        if (references.length === 0) {
            return '';
        }
        const currentReference = references.find((r) => r.range.containsPoint(point)) || references[0];
        return editor.getBuffer().getTextInRange(currentReference.range);
    }
}
exports.default = FindReferencesAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLHdDQUFpQztBQVlqQyxnRUFBZ0U7QUFDaEUsd0VBQXdFO0FBQ3hFLE1BQXFCLHFCQUFxQjtJQUN4QyxnRkFBZ0Y7SUFDaEYsMEVBQTBFO0lBQzFFLEVBQUU7SUFDRixzRkFBc0Y7SUFDdEYsRUFBRTtJQUNGLDJFQUEyRTtJQUMzRSw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLENBQUM7SUFDeEQsQ0FBQztJQUVELHlGQUF5RjtJQUN6RixrRUFBa0U7SUFDbEUsRUFBRTtJQUNGLDBGQUEwRjtJQUMxRixxQ0FBcUM7SUFDckMsd0ZBQXdGO0lBQ3hGLG1HQUFtRztJQUNuRyxFQUFFO0lBQ0Ysc0dBQXNHO0lBQ3RHLGNBQWM7SUFDRCxhQUFhLENBQ3hCLFVBQW9DLEVBQ3BDLE1BQWtCLEVBQ2xCLEtBQVksRUFDWixXQUEwQjs7WUFFMUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxVQUFVLENBQUMsY0FBYyxDQUMvQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQzNELENBQUM7WUFDRixJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxNQUFNLFVBQVUsR0FBd0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pHLE9BQU87Z0JBQ0wsSUFBSSxFQUFFLE1BQU07Z0JBQ1osT0FBTyxFQUFFLFdBQVcsSUFBSSxFQUFFO2dCQUMxQixvQkFBb0IsRUFBRSxxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQztnQkFDOUYsVUFBVTthQUNYLENBQUM7UUFDSixDQUFDO0tBQUE7SUFFRCx1RkFBdUY7SUFDdkYsRUFBRTtJQUNGLDBEQUEwRDtJQUMxRCwyQ0FBMkM7SUFDM0MsRUFBRTtJQUNGLCtEQUErRDtJQUN4RCxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBa0IsRUFBRSxLQUFZO1FBQ2xFLE9BQU87WUFDTCxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUM7WUFDNUQsUUFBUSxFQUFFLGlCQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztZQUN4QyxPQUFPLEVBQUUsRUFBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUM7U0FDcEMsQ0FBQztJQUNKLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsRUFBRTtJQUNGLHdDQUF3QztJQUN4QyxFQUFFO0lBQ0YsNERBQTREO0lBQ3JELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFrQjtRQUNsRCxPQUFPO1lBQ0wsR0FBRyxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDcEMsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQ2xELENBQUM7SUFDSixDQUFDO0lBRUQsd0ZBQXdGO0lBQ2pGLE1BQU0sQ0FBQyx1QkFBdUIsQ0FDbkMsTUFBa0IsRUFDbEIsS0FBWSxFQUNaLFVBQStCO1FBRS9CLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsT0FBTyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25FLENBQUM7Q0FDRjtBQW5GRCx3Q0FtRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdG9tSWRlIGZyb20gJ2F0b20taWRlJztcclxuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XHJcbmltcG9ydCB7XHJcbiAgUG9pbnQsXHJcbiAgVGV4dEVkaXRvcixcclxufSBmcm9tICdhdG9tJztcclxuaW1wb3J0IHtcclxuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgTG9jYXRpb24sXHJcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxyXG4gIFJlZmVyZW5jZVBhcmFtcyxcclxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XHJcblxyXG4vLyBQdWJsaWM6IEFkYXB0cyB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGRlZmluaXRpb24gcHJvdmlkZXIgdG8gdGhlXHJcbi8vIEF0b20gSURFIFVJIERlZmluaXRpb25zIHBhY2thZ2UgZm9yICdHbyBUbyBEZWZpbml0aW9uJyBmdW5jdGlvbmFsaXR5LlxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIge1xyXG4gIC8vIFB1YmxpYzogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBhZGFwdGVyIGNhbiBiZSB1c2VkIHRvIGFkYXB0IGEgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gYmFzZWQgb24gdGhlIHNlcnZlckNhcGFiaWxpdGllcyBtYXRyaXggY29udGFpbmluZyBhIHJlZmVyZW5jZXNQcm92aWRlci5cclxuICAvL1xyXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdG8gY29uc2lkZXIuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcclxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXHJcbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5yZWZlcmVuY2VzUHJvdmlkZXIgPT09IHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEdldCB0aGUgcmVmZXJlbmNlcyBmb3IgYSBzcGVjaWZpYyBzeW1ib2wgd2l0aGluIHRoZSBkb2N1bWVudCBhcyByZXByZXNlbnRlZCBieVxyXG4gIC8vIHRoZSB7VGV4dEVkaXRvcn0gYW5kIHtQb2ludH0gd2l0aGluIGl0IHZpYSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSBxdWVyaWVkXHJcbiAgLy8gICAgICAgICAgICAgICAgZm9yIHRoZSByZWZlcmVuY2VzLlxyXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHRleHQgdGhlIHJlZmVyZW5jZXMgc2hvdWxkIHJlbGF0ZSB0by5cclxuICAvLyAqIGBwb2ludGAgVGhlIEF0b20ge1BvaW50fSBjb250YWluaW5nIHRoZSBwb2ludCB3aXRoaW4gdGhlIHRleHQgdGhlIHJlZmVyZW5jZXMgc2hvdWxkIHJlbGF0ZSB0by5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhIHtGaW5kUmVmZXJlbmNlc1JldHVybn0gd2l0aCBhbGwgdGhlIHJlZmVyZW5jZXMgdGhlIGxhbmd1YWdlIHNlcnZlclxyXG4gIC8vIGNvdWxkIGZpbmQuXHJcbiAgcHVibGljIGFzeW5jIGdldFJlZmVyZW5jZXMoXHJcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgICBwb2ludDogUG9pbnQsXHJcbiAgICBwcm9qZWN0Um9vdDogc3RyaW5nIHwgbnVsbCxcclxuICApOiBQcm9taXNlPGF0b21JZGUuRmluZFJlZmVyZW5jZXNSZXR1cm4gfCBudWxsPiB7XHJcbiAgICBjb25zdCBsb2NhdGlvbnMgPSBhd2FpdCBjb25uZWN0aW9uLmZpbmRSZWZlcmVuY2VzKFxyXG4gICAgICBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIuY3JlYXRlUmVmZXJlbmNlUGFyYW1zKGVkaXRvciwgcG9pbnQpLFxyXG4gICAgKTtcclxuICAgIGlmIChsb2NhdGlvbnMgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZWZlcmVuY2VzOiBhdG9tSWRlLlJlZmVyZW5jZVtdID0gbG9jYXRpb25zLm1hcChGaW5kUmVmZXJlbmNlc0FkYXB0ZXIubG9jYXRpb25Ub1JlZmVyZW5jZSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnZGF0YScsXHJcbiAgICAgIGJhc2VVcmk6IHByb2plY3RSb290IHx8ICcnLFxyXG4gICAgICByZWZlcmVuY2VkU3ltYm9sTmFtZTogRmluZFJlZmVyZW5jZXNBZGFwdGVyLmdldFJlZmVyZW5jZWRTeW1ib2xOYW1lKGVkaXRvciwgcG9pbnQsIHJlZmVyZW5jZXMpLFxyXG4gICAgICByZWZlcmVuY2VzLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1JlZmVyZW5jZVBhcmFtc30gZnJvbSBhIGdpdmVuIHtUZXh0RWRpdG9yfSBmb3IgYSBzcGVjaWZpYyB7UG9pbnR9LlxyXG4gIC8vXHJcbiAgLy8gKiBgZWRpdG9yYCBBIHtUZXh0RWRpdG9yfSB0aGF0IHJlcHJlc2VudHMgdGhlIGRvY3VtZW50LlxyXG4gIC8vICogYHBvaW50YCBBIHtQb2ludH0gd2l0aGluIHRoZSBkb2N1bWVudC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UmVmZXJlbmNlUGFyYW1zfSBidWlsdCBmcm9tIHRoZSBnaXZlbiBwYXJhbWV0ZXJzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlUmVmZXJlbmNlUGFyYW1zKGVkaXRvcjogVGV4dEVkaXRvciwgcG9pbnQ6IFBvaW50KTogUmVmZXJlbmNlUGFyYW1zIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yKSxcclxuICAgICAgcG9zaXRpb246IENvbnZlcnQucG9pbnRUb1Bvc2l0aW9uKHBvaW50KSxcclxuICAgICAgY29udGV4dDoge2luY2x1ZGVEZWNsYXJhdGlvbjogdHJ1ZX0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEge0xvY2F0aW9ufSBpbnRvIGEge1JlZmVyZW5jZX0uXHJcbiAgLy9cclxuICAvLyAqIGBsb2NhdGlvbmAgQSB7TG9jYXRpb259IHRvIGNvbnZlcnQuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge1JlZmVyZW5jZX0gZXF1aXZhbGVudCB0byB0aGUgZ2l2ZW4ge0xvY2F0aW9ufS5cclxuICBwdWJsaWMgc3RhdGljIGxvY2F0aW9uVG9SZWZlcmVuY2UobG9jYXRpb246IExvY2F0aW9uKTogYXRvbUlkZS5SZWZlcmVuY2Uge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdXJpOiBDb252ZXJ0LnVyaVRvUGF0aChsb2NhdGlvbi51cmkpLFxyXG4gICAgICBuYW1lOiBudWxsLFxyXG4gICAgICByYW5nZTogQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UobG9jYXRpb24ucmFuZ2UpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogR2V0IGEgc3ltYm9sIG5hbWUgZnJvbSBhIHtUZXh0RWRpdG9yfSBmb3IgYSBzcGVjaWZpYyB7UG9pbnR9IGluIHRoZSBkb2N1bWVudC5cclxuICBwdWJsaWMgc3RhdGljIGdldFJlZmVyZW5jZWRTeW1ib2xOYW1lKFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcG9pbnQ6IFBvaW50LFxyXG4gICAgcmVmZXJlbmNlczogYXRvbUlkZS5SZWZlcmVuY2VbXSxcclxuICApOiBzdHJpbmcge1xyXG4gICAgaWYgKHJlZmVyZW5jZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuICAgIGNvbnN0IGN1cnJlbnRSZWZlcmVuY2UgPSByZWZlcmVuY2VzLmZpbmQoKHIpID0+IHIucmFuZ2UuY29udGFpbnNQb2ludChwb2ludCkpIHx8IHJlZmVyZW5jZXNbMF07XHJcbiAgICByZXR1cm4gZWRpdG9yLmdldEJ1ZmZlcigpLmdldFRleHRJblJhbmdlKGN1cnJlbnRSZWZlcmVuY2UucmFuZ2UpO1xyXG4gIH1cclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/linter-push-v2-adapter.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/linter-push-v2-adapter.js ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
// Public: Listen to diagnostics messages from the language server and publish them
// to the user by way of the Linter Push (Indie) v2 API supported by Atom IDE UI.
class LinterPushV2Adapter {
    // Public: Create a new {LinterPushV2Adapter} that will listen for diagnostics
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide diagnostics.
    constructor(connection) {
        this._diagnosticMap = new Map();
        this._diagnosticCodes = new Map();
        this._indies = new Set();
        connection.onPublishDiagnostics(this.captureDiagnostics.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LinterPushV2Adapter} to a given {V2IndieDelegate} registry.
    //
    // * `indie` A {V2IndieDelegate} that wants to receive messages.
    attach(indie) {
        this._indies.add(indie);
        this._diagnosticMap.forEach((value, key) => indie.setMessages(key, value));
        indie.onDidDestroy(() => {
            this._indies.delete(indie);
        });
    }
    // Public: Remove all {V2IndieDelegate} registries attached to this adapter and clear them.
    detachAll() {
        this._indies.forEach((i) => i.clearMessages());
        this._indies.clear();
    }
    // Public: Capture the diagnostics sent from a langguage server, convert them to the
    // Linter V2 format and forward them on to any attached {V2IndieDelegate}s.
    //
    // * `params` The {PublishDiagnosticsParams} received from the language server that should
    //            be captured and forwarded on to any attached {V2IndieDelegate}s.
    captureDiagnostics(params) {
        const path = convert_1.default.uriToPath(params.uri);
        const codeMap = new Map();
        const messages = params.diagnostics.map((d) => {
            const linterMessage = this.diagnosticToV2Message(path, d);
            codeMap.set(getCodeKey(linterMessage.location.position, d.message), d.code);
            return linterMessage;
        });
        this._diagnosticMap.set(path, messages);
        this._diagnosticCodes.set(path, codeMap);
        this._indies.forEach((i) => i.setMessages(path, messages));
    }
    // Public: Convert a single {Diagnostic} received from a language server into a single
    // {V2Message} expected by the Linter V2 API.
    //
    // * `path` A string representing the path of the file the diagnostic belongs to.
    // * `diagnostics` A {Diagnostic} object received from the language server.
    //
    // Returns a {V2Message} equivalent to the {Diagnostic} object supplied by the language server.
    diagnosticToV2Message(path, diagnostic) {
        return {
            location: {
                file: path,
                position: convert_1.default.lsRangeToAtomRange(diagnostic.range),
            },
            excerpt: diagnostic.message,
            linterName: diagnostic.source,
            severity: LinterPushV2Adapter.diagnosticSeverityToSeverity(diagnostic.severity || -1),
        };
    }
    // Public: Convert a diagnostic severity number obtained from the language server into
    // the textual equivalent for a Linter {V2Message}.
    //
    // * `severity` A number representing the severity of the diagnostic.
    //
    // Returns a string of 'error', 'warning' or 'info' depending on the severity.
    static diagnosticSeverityToSeverity(severity) {
        switch (severity) {
            case languageclient_1.DiagnosticSeverity.Error:
                return 'error';
            case languageclient_1.DiagnosticSeverity.Warning:
                return 'warning';
            case languageclient_1.DiagnosticSeverity.Information:
            case languageclient_1.DiagnosticSeverity.Hint:
            default:
                return 'info';
        }
    }
    // Private: Get the recorded diagnostic code for a range/message.
    // Diagnostic codes are tricky because there's no suitable place in the Linter API for them.
    // For now, we'll record the original code for each range/message combination and retrieve it
    // when needed (e.g. for passing back into code actions)
    getDiagnosticCode(editor, range, text) {
        const path = editor.getPath();
        if (path != null) {
            const diagnosticCodes = this._diagnosticCodes.get(path);
            if (diagnosticCodes != null) {
                return diagnosticCodes.get(getCodeKey(range, text)) || null;
            }
        }
        return null;
    }
}
exports.default = LinterPushV2Adapter;
function getCodeKey(range, text) {
    return [].concat(...range.serialize(), text).join(',');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGludGVyLXB1c2gtdjItYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsd0NBQWlDO0FBQ2pDLHNEQU0yQjtBQUUzQixtRkFBbUY7QUFDbkYsaUZBQWlGO0FBQ2pGLE1BQXFCLG1CQUFtQjtJQUt0Qyw4RUFBOEU7SUFDOUUsK0NBQStDO0lBQy9DLEVBQUU7SUFDRixvR0FBb0c7SUFDcEcsWUFBWSxVQUFvQztRQVJ4QyxtQkFBYyxHQUFrQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzFELHFCQUFnQixHQUFvRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzlFLFlBQU8sR0FBOEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQU9yRCxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCw2RUFBNkU7SUFDdEUsT0FBTztRQUNaLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQsbUZBQW1GO0lBQ25GLEVBQUU7SUFDRixnRUFBZ0U7SUFDekQsTUFBTSxDQUFDLEtBQTJCO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzRSxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztJQUNMLENB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Q2hCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEQsSUFBSSxlQUFlLElBQUksSUFBSSxFQUFFO2dCQUMzQixPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQzthQUM3RDtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUF6R0Qsc0NBeUdDO0FBRUQsU0FBUyxVQUFVLENBQUMsS0FBaUIsRUFBRSxJQUFZO0lBQ2pELE9BQVEsRUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGxpbnRlciBmcm9tICdhdG9tL2xpbnRlcic7XHJcbmltcG9ydCAqIGFzIGF0b20gZnJvbSAnYXRvbSc7XHJcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xyXG5pbXBvcnQge1xyXG4gIERpYWdub3N0aWMsXHJcbiAgRGlhZ25vc3RpY0NvZGUsXHJcbiAgRGlhZ25vc3RpY1NldmVyaXR5LFxyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBQdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXMsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5cclxuLy8gUHVibGljOiBMaXN0ZW4gdG8gZGlhZ25vc3RpY3MgbWVzc2FnZXMgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGFuZCBwdWJsaXNoIHRoZW1cclxuLy8gdG8gdGhlIHVzZXIgYnkgd2F5IG9mIHRoZSBMaW50ZXIgUHVzaCAoSW5kaWUpIHYyIEFQSSBzdXBwb3J0ZWQgYnkgQXRvbSBJREUgVUkuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExpbnRlclB1c2hWMkFkYXB0ZXIge1xyXG4gIHByaXZhdGUgX2RpYWdub3N0aWNNYXA6IE1hcDxzdHJpbmcsIGxpbnRlci5NZXNzYWdlW10+ID0gbmV3IE1hcCgpO1xyXG4gIHByaXZhdGUgX2RpYWdub3N0aWNDb2RlczogTWFwPHN0cmluZywgTWFwPHN0cmluZywgRGlhZ25vc3RpY0NvZGUgfCBudWxsPj4gPSBuZXcgTWFwKCk7XHJcbiAgcHJpdmF0ZSBfaW5kaWVzOiBTZXQ8bGludGVyLkluZGllRGVsZWdhdGU+ID0gbmV3IFNldCgpO1xyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIG5ldyB7TGludGVyUHVzaFYyQWRhcHRlcn0gdGhhdCB3aWxsIGxpc3RlbiBmb3IgZGlhZ25vc3RpY3NcclxuICAvLyB2aWEgdGhlIHN1cHBsaWVkIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259LlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBwcm92aWRlIGRpYWdub3N0aWNzLlxyXG4gIGNvbnN0cnVjdG9yKGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbikge1xyXG4gICAgY29ubmVjdGlvbi5vblB1Ymxpc2hEaWFnbm9zdGljcyh0aGlzLmNhcHR1cmVEaWFnbm9zdGljcy5iaW5kKHRoaXMpKTtcclxuICB9XHJcblxyXG4gIC8vIERpc3Bvc2UgdGhpcyBhZGFwdGVyIGVuc3VyaW5nIGFueSByZXNvdXJjZXMgYXJlIGZyZWVkIGFuZCBldmVudHMgdW5ob29rZWQuXHJcbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRldGFjaEFsbCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBBdHRhY2ggdGhpcyB7TGludGVyUHVzaFYyQWRhcHRlcn0gdG8gYSBnaXZlbiB7VjJJbmRpZURlbGVnYXRlfSByZWdpc3RyeS5cclxuICAvL1xyXG4gIC8vICogYGluZGllYCBBIHtWMkluZGllRGVsZWdhdGV9IHRoYXQgd2FudHMgdG8gcmVjZWl2ZSBtZXNzYWdlcy5cclxuICBwdWJsaWMgYXR0YWNoKGluZGllOiBsaW50ZXIuSW5kaWVEZWxlZ2F0ZSk6IHZvaWQge1xyXG4gICAgdGhpcy5faW5kaWVzLmFkZChpbmRpZSk7XHJcbiAgICB0aGlzLl9kaWFnbm9zdGljTWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IGluZGllLnNldE1lc3NhZ2VzKGtleSwgdmFsdWUpKTtcclxuICAgIGluZGllLm9uRGlkRGVzdHJveSgoKSA9PiB7XHJcbiAgICAgIHRoaXMuX2luZGllcy5kZWxldGUoaW5kaWUpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlbW92ZSBhbGwge1YySW5kaWVEZWxlZ2F0ZX0gcmVnaXN0cmllcyBhdHRhY2hlZCB0byB0aGlzIGFkYXB0ZXIgYW5kIGNsZWFyIHRoZW0uXHJcbiAgcHVibGljIGRldGFjaEFsbCgpOiB2b2lkIHtcclxuICAgIHRoaXMuX2luZGllcy5mb3JFYWNoKChpKSA9PiBpLmNsZWFyTWVzc2FnZXMoKSk7XHJcbiAgICB0aGlzLl9pbmRpZXMuY2xlYXIoKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ2FwdHVyZSB0aGUgZGlhZ25vc3RpY3Mgc2VudCBmcm9tIGEgbGFuZ2d1YWdlIHNlcnZlciwgY29udmVydCB0aGVtIHRvIHRoZVxyXG4gIC8vIExpbnRlciBWMiBmb3JtYXQgYW5kIGZvcndhcmQgdGhlbSBvbiB0byBhbnkgYXR0YWNoZWQge1YySW5kaWVEZWxlZ2F0ZX1zLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1B1Ymxpc2hEaWFnbm9zdGljc1BhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgc2hvdWxkXHJcbiAgLy8gICAgICAgICAgICBiZSBjYXB0dXJlZCBhbmQgZm9yd2FyZGVkIG9uIHRvIGFueSBhdHRhY2hlZCB7VjJJbmRpZURlbGVnYXRlfXMuXHJcbiAgcHVibGljIGNhcHR1cmVEaWFnbm9zdGljcyhwYXJhbXM6IFB1Ymxpc2hEaWFnbm9zdGljc1BhcmFtcyk6IHZvaWQge1xyXG4gICAgY29uc3QgcGF0aCA9IENvbnZlcnQudXJpVG9QYXRoKHBhcmFtcy51cmkpO1xyXG4gICAgY29uc3QgY29kZU1hcCA9IG5ldyBNYXAoKTtcclxuICAgIGNvbnN0IG1lc3NhZ2VzID0gcGFyYW1zLmRpYWdub3N0aWNzLm1hcCgoZCkgPT4ge1xyXG4gICAgICBjb25zdCBsaW50ZXJNZXNzYWdlID0gdGhpcy5kaWFnbm9zdGljVG9WMk1lc3NhZ2UocGF0aCwgZCk7XHJcbiAgICAgIGNvZGVNYXAuc2V0KGdldENvZGVLZXkobGludGVyTWVzc2FnZS5sb2NhdGlvbi5wb3NpdGlvbiwgZC5tZXNzYWdlKSwgZC5jb2RlKTtcclxuICAgICAgcmV0dXJuIGxpbnRlck1lc3NhZ2U7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuX2RpYWdub3N0aWNNYXAuc2V0KHBhdGgsIG1lc3NhZ2VzKTtcclxuICAgIHRoaXMuX2RpYWdub3N0aWNDb2Rlcy5zZXQocGF0aCwgY29kZU1hcCk7XHJcbiAgICB0aGlzLl9pbmRpZXMuZm9yRWFjaCgoaSkgPT4gaS5zZXRNZXNzYWdlcyhwYXRoLCBtZXNzYWdlcykpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgc2luZ2xlIHtEaWFnbm9zdGljfSByZWNlaXZlZCBmcm9tIGEgbGFuZ3VhZ2Ugc2VydmVyIGludG8gYSBzaW5nbGVcclxuICAvLyB7VjJNZXNzYWdlfSBleHBlY3RlZCBieSB0aGUgTGludGVyIFYyIEFQSS5cclxuICAvL1xyXG4gIC8vICogYHBhdGhgIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcGF0aCBvZiB0aGUgZmlsZSB0aGUgZGlhZ25vc3RpYyBiZWxvbmdzIHRvLlxyXG4gIC8vICogYGRpYWdub3N0aWNzYCBBIHtEaWFnbm9zdGljfSBvYmplY3QgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHtWMk1lc3NhZ2V9IGVxdWl2YWxlbnQgdG8gdGhlIHtEaWFnbm9zdGljfSBvYmplY3Qgc3VwcGxpZWQgYnkgdGhlIGxhbmd1YWdlIHNlcnZlci5cclxuICBwdWJsaWMgZGlhZ25vc3RpY1RvVjJNZXNzYWdlKHBhdGg6IHN0cmluZywgZGlhZ25vc3RpYzogRGlhZ25vc3RpYyk6IGxpbnRlci5NZXNzYWdlIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGxvY2F0aW9uOiB7XHJcbiAgICAgICAgZmlsZTogcGF0aCxcclxuICAgICAgICBwb3NpdGlvbjogQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UoZGlhZ25vc3RpYy5yYW5nZSksXHJcbiAgICAgIH0sXHJcbiAgICAgIGV4Y2VycHQ6IGRpYWdub3N0aWMubWVzc2FnZSxcclxuICAgICAgbGludGVyTmFtZTogZGlhZ25vc3RpYy5zb3VyY2UsXHJcbiAgICAgIHNldmVyaXR5OiBMaW50ZXJQdXNoVjJBZGFwdGVyLmRpYWdub3N0aWNTZXZlcml0eVRvU2V2ZXJpdHkoZGlhZ25vc3RpYy5zZXZlcml0eSB8fCAtMSksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgZGlhZ25vc3RpYyBzZXZlcml0eSBudW1iZXIgb2J0YWluZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIGludG9cclxuICAvLyB0aGUgdGV4dHVhbCBlcXVpdmFsZW50IGZvciBhIExpbnRlciB7VjJNZXNzYWdlfS5cclxuICAvL1xyXG4gIC8vICogYHNldmVyaXR5YCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHNldmVyaXR5IG9mIHRoZSBkaWFnbm9zdGljLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHN0cmluZyBvZiAnZXJyb3InLCAnd2FybmluZycgb3IgJ2luZm8nIGRlcGVuZGluZyBvbiB0aGUgc2V2ZXJpdHkuXHJcbiAgcHVibGljIHN0YXRpYyBkaWFnbm9zdGljU2V2ZXJpdHlUb1NldmVyaXR5KHNldmVyaXR5OiBudW1iZXIpOiAnZXJyb3InIHwgJ3dhcm5pbmcnIHwgJ2luZm8nIHtcclxuICAgIHN3aXRjaCAoc2V2ZXJpdHkpIHtcclxuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3I6XHJcbiAgICAgICAgcmV0dXJuICdlcnJvcic7XHJcbiAgICAgIGNhc2UgRGlhZ25vc3RpY1NldmVyaXR5Lldhcm5pbmc6XHJcbiAgICAgICAgcmV0dXJuICd3YXJuaW5nJztcclxuICAgICAgY2FzZSBEaWFnbm9zdGljU2V2ZXJpdHkuSW5mb3JtYXRpb246XHJcbiAgICAgIGNhc2UgRGlhZ25vc3RpY1NldmVyaXR5LkhpbnQ6XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuICdpbmZvJztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFByaXZhdGU6IEdldCB0aGUgcmVjb3JkZWQgZGlhZ25vc3RpYyBjb2RlIGZvciBhIHJhbmdlL21lc3NhZ2UuXHJcbiAgLy8gRGlhZ25vc3RpYyBjb2RlcyBhcmUgdHJpY2t5IGJlY2F1c2UgdGhlcmUncyBubyBzdWl0YWJsZSBwbGFjZSBpbiB0aGUgTGludGVyIEFQSSBmb3IgdGhlbS5cclxuICAvLyBGb3Igbm93LCB3ZSdsbCByZWNvcmQgdGhlIG9yaWdpbmFsIGNvZGUgZm9yIGVhY2ggcmFuZ2UvbWVzc2FnZSBjb21iaW5hdGlvbiBhbmQgcmV0cmlldmUgaXRcclxuICAvLyB3aGVuIG5lZWRlZCAoZS5nLiBmb3IgcGFzc2luZyBiYWNrIGludG8gY29kZSBhY3Rpb25zKVxyXG4gIHB1YmxpYyBnZXREaWFnbm9zdGljQ29kZShlZGl0b3I6IGF0b20uVGV4dEVkaXRvciwgcmFuZ2U6IGF0b20uUmFuZ2UsIHRleHQ6IHN0cmluZyk6IERpYWdub3N0aWNDb2RlIHwgbnVsbCB7XHJcbiAgICBjb25zdCBwYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcclxuICAgIGlmIChwYXRoICE9IG51bGwpIHtcclxuICAgICAgY29uc3QgZGlhZ25vc3RpY0NvZGVzID0gdGhpcy5fZGlhZ25vc3RpY0NvZGVzLmdldChwYXRoKTtcclxuICAgICAgaWYgKGRpYWdub3N0aWNDb2RlcyAhPSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpYWdub3N0aWNDb2Rlcy5nZXQoZ2V0Q29kZUtleShyYW5nZSwgdGV4dCkpIHx8IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q29kZUtleShyYW5nZTogYXRvbS5SYW5nZSwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuICByZXR1cm4gKFtdIGFzIGFueVtdKS5jb25jYXQoLi4ucmFuZ2Uuc2VyaWFsaXplKCksIHRleHQpLmpvaW4oJywnKTtcclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/logging-console-adapter.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/logging-console-adapter.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
// Adapts Atom's user notifications to those of the language server protocol.
class LoggingConsoleAdapter {
    // Create a new {LoggingConsoleAdapter} that will listen for log messages
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide log messages.
    constructor(connection) {
        this._consoles = new Set();
        connection.onLogMessage(this.logMessage.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LoggingConsoleAdapter} to a given {ConsoleApi}.
    //
    // * `console` A {ConsoleApi} that wants to receive messages.
    attach(console) {
        this._consoles.add(console);
    }
    // Public: Remove all {ConsoleApi}'s attached to this adapter.
    detachAll() {
        this._consoles.clear();
    }
    // Log a message using the Atom IDE UI Console API.
    //
    // * `params` The {LogMessageParams} received from the language server
    //            indicating the details of the message to be loggedd.
    logMessage(params) {
        switch (params.type) {
            case languageclient_1.MessageType.Error: {
                this._consoles.forEach((c) => c.error(params.message));
                return;
            }
            case languageclient_1.MessageType.Warning: {
                this._consoles.forEach((c) => c.warn(params.message));
                return;
            }
            case languageclient_1.MessageType.Info: {
                this._consoles.forEach((c) => c.info(params.message));
                return;
            }
            case languageclient_1.MessageType.Log: {
                this._consoles.forEach((c) => c.log(params.message));
                return;
            }
        }
    }
}
exports.default = LoggingConsoleAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy1jb25zb2xlLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvbG9nZ2luZy1jb25zb2xlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzREFJMkI7QUFFM0IsNkVBQTZFO0FBQzdFLE1BQXFCLHFCQUFxQjtJQUd4Qyx5RUFBeUU7SUFDekUsK0NBQStDO0lBQy9DLEVBQUU7SUFDRixxR0FBcUc7SUFDckcsWUFBWSxVQUFvQztRQU54QyxjQUFTLEdBQW9CLElBQUksR0FBRyxFQUFFLENBQUM7UUFPN0MsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCw2RUFBNkU7SUFDdEUsT0FBTztRQUNaLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQsdUVBQXVFO0lBQ3ZFLEVBQUU7SUFDRiw2REFBNkQ7SUFDdEQsTUFBTSxDQUFDLE9BQW1CO1FBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCw4REFBOEQ7SUFDdkQsU0FBUztRQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELG1EQUFtRDtJQUNuRCxFQUFFO0lBQ0Ysc0VBQXNFO0lBQ3RFLGtFQUFrRTtJQUMxRCxVQUFVLENBQUMsTUFBd0I7UUFDekMsUUFBUSxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ25CLEtBQUssNEJBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE9BQU87YUFDUjtZQUNELEtBQUssNEJBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE9BQU87YUFDUjtZQUNELEtBQUssNEJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE9BQU87YUFDUjtZQUNELEtBQUssNEJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE9BQU87YUFDUjtTQUNGO0lBQ0gsQ0FBQztDQUNGO0FBcERELHdDQW9EQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnNvbGVBcGkgfSBmcm9tICdhdG9tLWlkZSc7XHJcbmltcG9ydCB7XHJcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gIExvZ01lc3NhZ2VQYXJhbXMsXHJcbiAgTWVzc2FnZVR5cGUsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5cclxuLy8gQWRhcHRzIEF0b20ncyB1c2VyIG5vdGlmaWNhdGlvbnMgdG8gdGhvc2Ugb2YgdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbC5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTG9nZ2luZ0NvbnNvbGVBZGFwdGVyIHtcclxuICBwcml2YXRlIF9jb25zb2xlczogU2V0PENvbnNvbGVBcGk+ID0gbmV3IFNldCgpO1xyXG5cclxuICAvLyBDcmVhdGUgYSBuZXcge0xvZ2dpbmdDb25zb2xlQWRhcHRlcn0gdGhhdCB3aWxsIGxpc3RlbiBmb3IgbG9nIG1lc3NhZ2VzXHJcbiAgLy8gdmlhIHRoZSBzdXBwbGllZCB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufS5cclxuICAvL1xyXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHdpbGwgcHJvdmlkZSBsb2cgbWVzc2FnZXMuXHJcbiAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKSB7XHJcbiAgICBjb25uZWN0aW9uLm9uTG9nTWVzc2FnZSh0aGlzLmxvZ01lc3NhZ2UuYmluZCh0aGlzKSk7XHJcbiAgfVxyXG5cclxuICAvLyBEaXNwb3NlIHRoaXMgYWRhcHRlciBlbnN1cmluZyBhbnkgcmVzb3VyY2VzIGFyZSBmcmVlZCBhbmQgZXZlbnRzIHVuaG9va2VkLlxyXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5kZXRhY2hBbGwoKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQXR0YWNoIHRoaXMge0xvZ2dpbmdDb25zb2xlQWRhcHRlcn0gdG8gYSBnaXZlbiB7Q29uc29sZUFwaX0uXHJcbiAgLy9cclxuICAvLyAqIGBjb25zb2xlYCBBIHtDb25zb2xlQXBpfSB0aGF0IHdhbnRzIHRvIHJlY2VpdmUgbWVzc2FnZXMuXHJcbiAgcHVibGljIGF0dGFjaChjb25zb2xlOiBDb25zb2xlQXBpKTogdm9pZCB7XHJcbiAgICB0aGlzLl9jb25zb2xlcy5hZGQoY29uc29sZSk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlbW92ZSBhbGwge0NvbnNvbGVBcGl9J3MgYXR0YWNoZWQgdG8gdGhpcyBhZGFwdGVyLlxyXG4gIHB1YmxpYyBkZXRhY2hBbGwoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9jb25zb2xlcy5jbGVhcigpO1xyXG4gIH1cclxuXHJcbiAgLy8gTG9nIGEgbWVzc2FnZSB1c2luZyB0aGUgQXRvbSBJREUgVUkgQ29uc29sZSBBUEkuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7TG9nTWVzc2FnZVBhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gICAgICAgICAgICBpbmRpY2F0aW5nIHRoZSBkZXRhaWxzIG9mIHRoZSBtZXNzYWdlIHRvIGJlIGxvZ2dlZGQuXHJcbiAgcHJpdmF0ZSBsb2dNZXNzYWdlKHBhcmFtczogTG9nTWVzc2FnZVBhcmFtcyk6IHZvaWQge1xyXG4gICAgc3dpdGNoIChwYXJhbXMudHlwZSkge1xyXG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlLkVycm9yOiB7XHJcbiAgICAgICAgdGhpcy5fY29uc29sZXMuZm9yRWFjaCgoYykgPT4gYy5lcnJvcihwYXJhbXMubWVzc2FnZSkpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlLldhcm5pbmc6IHtcclxuICAgICAgICB0aGlzLl9jb25zb2xlcy5mb3JFYWNoKChjKSA9PiBjLndhcm4ocGFyYW1zLm1lc3NhZ2UpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgY2FzZSBNZXNzYWdlVHlwZS5JbmZvOiB7XHJcbiAgICAgICAgdGhpcy5fY29uc29sZXMuZm9yRWFjaCgoYykgPT4gYy5pbmZvKHBhcmFtcy5tZXNzYWdlKSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGNhc2UgTWVzc2FnZVR5cGUuTG9nOiB7XHJcbiAgICAgICAgdGhpcy5fY29uc29sZXMuZm9yRWFjaCgoYykgPT4gYy5sb2cocGFyYW1zLm1lc3NhZ2UpKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/notifications-adapter.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/notifications-adapter.js ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
// Public: Adapts Atom's user notifications to those of the language server protocol.
class NotificationsAdapter {
    // Public: Attach to a {LanguageClientConnection} to recieve events indicating
    // when user notifications should be displayed.
    static attach(connection, name, projectPath) {
        connection.onShowMessage((m) => NotificationsAdapter.onShowMessage(m, name, projectPath));
        connection.onShowMessageRequest((m) => NotificationsAdapter.onShowMessageRequest(m, name, projectPath));
    }
    // Public: Show a notification message with buttons using the Atom notifications API.
    //
    // * `params` The {ShowMessageRequestParams} received from the language server
    //            indicating the details of the notification to be displayed.
    // * `name`   The name of the language server so the user can identify the
    //            context of the message.
    // * `projectPath`   The path of the current project.
    static onShowMessageRequest(params, name, projectPath) {
        return new Promise((resolve, _reject) => {
            const options = {
                dismissable: true,
                detail: `${name} ${projectPath}`,
            };
            if (params.actions) {
                options.buttons = params.actions.map((a) => ({
                    text: a.title,
                    onDidClick: () => {
                        resolve(a);
                        if (notification != null) {
                            notification.dismiss();
                        }
                    },
                }));
            }
            const notification = addNotificationForMessage(params.type, params.message, options);
            if (notification != null) {
                notification.onDidDismiss(() => {
                    resolve(null);
                });
            }
        });
    }
    // Public: Show a notification message using the Atom notifications API.
    //
    // * `params` The {ShowMessageParams} received from the language server
    //            indicating the details of the notification to be displayed.
    // * `name`   The name of the language server so the user can identify the
    //            context of the message.
    // * `projectPath`   The path of the current project.
    static onShowMessage(params, name, projectPath) {
        addNotificationForMessage(params.type, params.message, {
            dismissable: true,
            detail: `${name} ${projectPath}`,
        });
    }
    // Public: Convert a {MessageActionItem} from the language server into an
    // equivalent {NotificationButton} within Atom.
    //
    // * `actionItem` The {MessageActionItem} to be converted.
    //
    // Returns a {NotificationButton} equivalent to the {MessageActionItem} given.
    static actionItemToNotificationButton(actionItem) {
        return {
            text: actionItem.title,
        };
    }
}
exports.default = NotificationsAdapter;
function messageTypeToString(messageType) {
    switch (messageType) {
        case languageclient_1.MessageType.Error: return 'error';
        case languageclient_1.MessageType.Warning: return 'warning';
        default: return 'info';
    }
}
function addNotificationForMessage(messageType, message, options) {
    function isDuplicate(note) {
        const noteDismissed = note.isDismissed && note.isDismissed();
        const noteOptions = note.getOptions && note.getOptions() || {};
        return !noteDismissed &&
            note.getType() === messageTypeToString(messageType) &&
            note.getMessage() === message &&
            noteOptions.detail === options.detail;
    }
    if (atom.notifications.getNotifications().some(isDuplicate)) {
        return null;
    }
    switch (messageType) {
        case languageclient_1.MessageType.Error:
            return atom.notifications.addError(message, options);
        case languageclient_1.MessageType.Warning:
            return atom.notifications.addWarning(message, options);
        case languageclient_1.MessageType.Log:
            // console.log(params.message);
            return null;
        case languageclient_1.MessageType.Info:
        default:
            return atom.notifications.addInfo(message, options);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL25vdGlmaWNhdGlvbnMtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQU0yQjtBQU8zQixxRkFBcUY7QUFDckYsTUFBcUIsb0JBQW9CO0lBQ3ZDLDhFQUE4RTtJQUM5RSwrQ0FBK0M7SUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FDbEIsVUFBb0MsRUFDcEMsSUFBWSxFQUNaLFdBQW1CO1FBRW5CLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDMUYsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDMUcsQ0FBQztJQUVELHFGQUFxRjtJQUNyRixFQUFFO0lBQ0YsOEVBQThFO0lBQzlFLHlFQUF5RTtJQUN6RSwwRUFBMEU7SUFDMUUscUNBQXFDO0lBQ3JDLHFEQUFxRDtJQUM5QyxNQUFNLENBQUMsb0JBQW9CLENBQ2hDLE1BQWdDLEVBQ2hDLElBQVksRUFDWixXQUFtQjtRQUVuQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3RDLE1BQU0sT0FBTyxHQUF3QjtnQkFDbkMsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxHQUFHLElBQUksSUFBSSxXQUFXLEVBQUU7YUFDakMsQ0FBQztZQUNGLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtnQkFDbEIsT0FBTyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxD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Q0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pELEtBQUssNEJBQVcsQ0FBQyxHQUFHO1lBQ2xCLCtCQUErQjtZQUMvQixPQUFPLElBQUksQ0FBQztRQUNkLEtBQUssNEJBQVcsQ0FBQyxJQUFJLENBQUM7UUFDdEI7WUFDRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN2RDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcclxuICBNZXNzYWdlVHlwZSxcclxuICBNZXNzYWdlQWN0aW9uSXRlbSxcclxuICBTaG93TWVzc2FnZVBhcmFtcyxcclxuICBTaG93TWVzc2FnZVJlcXVlc3RQYXJhbXMsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5pbXBvcnQge1xyXG4gIE5vdGlmaWNhdGlvbixcclxuICBOb3RpZmljYXRpb25PcHRpb25zLFxyXG4gIE5vdGlmaWNhdGlvbkV4dCxcclxufSBmcm9tICdhdG9tJztcclxuXHJcbi8vIFB1YmxpYzogQWRhcHRzIEF0b20ncyB1c2VyIG5vdGlmaWNhdGlvbnMgdG8gdGhvc2Ugb2YgdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbC5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTm90aWZpY2F0aW9uc0FkYXB0ZXIge1xyXG4gIC8vIFB1YmxpYzogQXR0YWNoIHRvIGEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gcmVjaWV2ZSBldmVudHMgaW5kaWNhdGluZ1xyXG4gIC8vIHdoZW4gdXNlciBub3RpZmljYXRpb25zIHNob3VsZCBiZSBkaXNwbGF5ZWQuXHJcbiAgcHVibGljIHN0YXRpYyBhdHRhY2goXHJcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICBwcm9qZWN0UGF0aDogc3RyaW5nLFxyXG4gICkge1xyXG4gICAgY29ubmVjdGlvbi5vblNob3dNZXNzYWdlKChtKSA9PiBOb3RpZmljYXRpb25zQWRhcHRlci5vblNob3dNZXNzYWdlKG0sIG5hbWUsIHByb2plY3RQYXRoKSk7XHJcbiAgICBjb25uZWN0aW9uLm9uU2hvd01lc3NhZ2VSZXF1ZXN0KChtKSA9PiBOb3RpZmljYXRpb25zQWRhcHRlci5vblNob3dNZXNzYWdlUmVxdWVzdChtLCBuYW1lLCBwcm9qZWN0UGF0aCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTaG93IGEgbm90aWZpY2F0aW9uIG1lc3NhZ2Ugd2l0aCBidXR0b25zIHVzaW5nIHRoZSBBdG9tIG5vdGlmaWNhdGlvbnMgQVBJLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1Nob3dNZXNzYWdlUmVxdWVzdFBhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gICAgICAgICAgICBpbmRpY2F0aW5nIHRoZSBkZXRhaWxzIG9mIHRoZSBub3RpZmljYXRpb24gdG8gYmUgZGlzcGxheWVkLlxyXG4gIC8vICogYG5hbWVgICAgVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHNlcnZlciBzbyB0aGUgdXNlciBjYW4gaWRlbnRpZnkgdGhlXHJcbiAgLy8gICAgICAgICAgICBjb250ZXh0IG9mIHRoZSBtZXNzYWdlLlxyXG4gIC8vICogYHByb2plY3RQYXRoYCAgIFRoZSBwYXRoIG9mIHRoZSBjdXJyZW50IHByb2plY3QuXHJcbiAgcHVibGljIHN0YXRpYyBvblNob3dNZXNzYWdlUmVxdWVzdChcclxuICAgIHBhcmFtczogU2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgcHJvamVjdFBhdGg6IHN0cmluZyxcclxuICApOiBQcm9taXNlPE1lc3NhZ2VBY3Rpb25JdGVtIHwgbnVsbD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCBfcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IG9wdGlvbnM6IE5vdGlmaWNhdGlvbk9wdGlvbnMgPSB7XHJcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXHJcbiAgICAgICAgZGV0YWlsOiBgJHtuYW1lfSAke3Byb2plY3RQYXRofWAsXHJcbiAgICAgIH07XHJcbiAgICAgIGlmIChwYXJhbXMuYWN0aW9ucykge1xyXG4gICAgICAgIG9wdGlvbnMuYnV0dG9ucyA9IHBhcmFtcy5hY3Rpb25zLm1hcCgoYSkgPT4gKHtcclxuICAgICAgICAgIHRleHQ6IGEudGl0bGUsXHJcbiAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoYSk7XHJcbiAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBub3RpZmljYXRpb24gPSBhZGROb3RpZmljYXRpb25Gb3JNZXNzYWdlKFxyXG4gICAgICAgIHBhcmFtcy50eXBlLFxyXG4gICAgICAgIHBhcmFtcy5tZXNzYWdlLFxyXG4gICAgICAgIG9wdGlvbnMpO1xyXG5cclxuICAgICAgaWYgKG5vdGlmaWNhdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgbm90aWZpY2F0aW9uLm9uRGlkRGlzbWlzcygoKSA9PiB7XHJcbiAgICAgICAgICByZXNvbHZlKG51bGwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2hvdyBhIG5vdGlmaWNhdGlvbiBtZXNzYWdlIHVzaW5nIHRoZSBBdG9tIG5vdGlmaWNhdGlvbnMgQVBJLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1Nob3dNZXNzYWdlUGFyYW1zfSByZWNlaXZlZCBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcclxuICAvLyAgICAgICAgICAgIGluZGljYXRpbmcgdGhlIGRldGFpbHMgb2YgdGhlIG5vdGlmaWNhdGlvbiB0byBiZSBkaXNwbGF5ZWQuXHJcbiAgLy8gKiBgbmFtZWAgICBUaGUgbmFtZSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHNvIHRoZSB1c2VyIGNhbiBpZGVudGlmeSB0aGVcclxuICAvLyAgICAgICAgICAgIGNvbnRleHQgb2YgdGhlIG1lc3NhZ2UuXHJcbiAgLy8gKiBgcHJvamVjdFBhdGhgICAgVGhlIHBhdGggb2YgdGhlIGN1cnJlbnQgcHJvamVjdC5cclxuICBwdWJsaWMgc3RhdGljIG9uU2hvd01lc3NhZ2UoXHJcbiAgICBwYXJhbXM6IFNob3dNZXNzYWdlUGFyYW1zLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgcHJvamVjdFBhdGg6IHN0cmluZyxcclxuICApOiB2b2lkIHtcclxuICAgIGFkZE5vdGlmaWNhdGlvbkZvck1lc3NhZ2UocGFyYW1zLnR5cGUsIHBhcmFtcy5tZXNzYWdlLCB7XHJcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxyXG4gICAgICBkZXRhaWw6IGAke25hbWV9ICR7cHJvamVjdFBhdGh9YCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEge01lc3NhZ2VBY3Rpb25JdGVtfSBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgaW50byBhblxyXG4gIC8vIGVxdWl2YWxlbnQge05vdGlmaWNhdGlvbkJ1dHRvbn0gd2l0aGluIEF0b20uXHJcbiAgLy9cclxuICAvLyAqIGBhY3Rpb25JdGVtYCBUaGUge01lc3NhZ2VBY3Rpb25JdGVtfSB0byBiZSBjb252ZXJ0ZWQuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge05vdGlmaWNhdGlvbkJ1dHRvbn0gZXF1aXZhbGVudCB0byB0aGUge01lc3NhZ2VBY3Rpb25JdGVtfSBnaXZlbi5cclxuICBwdWJsaWMgc3RhdGljIGFjdGlvbkl0ZW1Ub05vdGlmaWNhdGlvbkJ1dHRvbihcclxuICAgIGFjdGlvbkl0ZW06IE1lc3NhZ2VBY3Rpb25JdGVtLFxyXG4gICkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdGV4dDogYWN0aW9uSXRlbS50aXRsZSxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBtZXNzYWdlVHlwZVRvU3RyaW5nKFxyXG4gIG1lc3NhZ2VUeXBlOiBudW1iZXIsXHJcbik6IHN0cmluZyB7XHJcbiAgc3dpdGNoIChtZXNzYWdlVHlwZSkge1xyXG4gICAgY2FzZSBNZXNzYWdlVHlwZS5FcnJvcjogcmV0dXJuICdlcnJvcic7XHJcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLldhcm5pbmc6IHJldHVybiAnd2FybmluZyc7XHJcbiAgICBkZWZhdWx0OiByZXR1cm4gJ2luZm8nO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gYWRkTm90aWZpY2F0aW9uRm9yTWVzc2FnZShcclxuICBtZXNzYWdlVHlwZTogbnVtYmVyLFxyXG4gIG1lc3NhZ2U6IHN0cmluZyxcclxuICBvcHRpb25zOiBOb3RpZmljYXRpb25PcHRpb25zLFxyXG4pOiBOb3RpZmljYXRpb24gfCBudWxsIHtcclxuICBmdW5jdGlvbiBpc0R1cGxpY2F0ZShub3RlOiBOb3RpZmljYXRpb25FeHQpOiBib29sZWFuIHtcclxuICAgIGNvbnN0IG5vdGVEaXNtaXNzZWQgPSBub3RlLmlzRGlzbWlzc2VkICYmIG5vdGUuaXNEaXNtaXNzZWQoKTtcclxuICAgIGNvbnN0IG5vdGVPcHRpb25zID0gbm90ZS5nZXRPcHRpb25zICYmIG5vdGUuZ2V0T3B0aW9ucygpIHx8IHt9O1xyXG4gICAgcmV0dXJuICFub3RlRGlzbWlzc2VkICYmXHJcbiAgICAgIG5vdGUuZ2V0VHlwZSgpID09PSBtZXNzYWdlVHlwZVRvU3RyaW5nKG1lc3NhZ2VUeXBlKSAmJlxyXG4gICAgICBub3RlLmdldE1lc3NhZ2UoKSA9PT0gbWVzc2FnZSAmJlxyXG4gICAgICBub3RlT3B0aW9ucy5kZXRhaWwgPT09IG9wdGlvbnMuZGV0YWlsO1xyXG4gIH1cclxuICBpZiAoYXRvbS5ub3RpZmljYXRpb25zLmdldE5vdGlmaWNhdGlvbnMoKS5zb21lKGlzRHVwbGljYXRlKSkge1xyXG4gICAgcmV0dXJuIG51bGw7XHJcbiAgfVxyXG5cclxuICBzd2l0Y2ggKG1lc3NhZ2VUeXBlKSB7XHJcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLkVycm9yOlxyXG4gICAgICByZXR1cm4gYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKG1lc3NhZ2UsIG9wdGlvbnMpO1xyXG4gICAgY2FzZSBNZXNzYWdlVHlwZS5XYXJuaW5nOlxyXG4gICAgICByZXR1cm4gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcobWVzc2FnZSwgb3B0aW9ucyk7XHJcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLkxvZzpcclxuICAgICAgLy8gY29uc29sZS5sb2cocGFyYW1zLm1lc3NhZ2UpO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIGNhc2UgTWVzc2FnZVR5cGUuSW5mbzpcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhtZXNzYWdlLCBvcHRpb25zKTtcclxuICB9XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/outline-view-adapter.js":
/*!*************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/outline-view-adapter.js ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const Utils = __webpack_require__(/*! ../utils */ "./node_modules/atom-languageclient/build/lib/utils.js");
const languageclient_1 = __webpack_require__(/*! ../languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
// Public: Adapts the documentSymbolProvider of the language server to the Outline View
// supplied by Atom IDE UI.
class OutlineViewAdapter {
    constructor() {
        this._cancellationTokens = new WeakMap();
    }
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a documentSymbolProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.documentSymbolProvider === true;
    }
    // Public: Obtain the Outline for document via the {LanguageClientConnection} as identified
    // by the {TextEditor}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the outline.
    // * `editor` The Atom {TextEditor} containing the text the Outline should represent.
    //
    // Returns a {Promise} containing the {Outline} of this document.
    getOutline(connection, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Utils.doWithCancellationToken(connection, this._cancellationTokens, (cancellationToken) => connection.documentSymbol({ textDocument: convert_1.default.editorToTextDocumentIdentifier(editor) }, cancellationToken));
            if (results.length === 0) {
                return {
                    outlineTrees: [],
                };
            }
            if (results[0].selectionRange !== undefined) {
                // If the server is giving back the newer DocumentSymbol format.
                return {
                    outlineTrees: OutlineViewAdapter.createHierarchicalOutlineTrees(results),
                };
            }
            else {
                // If the server is giving back the original SymbolInformation format.
                return {
                    outlineTrees: OutlineViewAdapter.createOutlineTrees(results),
                };
            }
        });
    }
    // Public: Create an {Array} of {OutlineTree}s from the Array of {DocumentSymbol} recieved
    // from the language server. This includes converting all the children nodes in the entire
    // hierarchy.
    //
    // * `symbols` An {Array} of {DocumentSymbol}s received from the language server that
    //             should be converted to an {Array} of {OutlineTree}.
    //
    // Returns an {Array} of {OutlineTree} containing the given symbols that the Outline View can display.
    static createHierarchicalOutlineTrees(symbols) {
        // Sort all the incoming symbols
        symbols.sort((a, b) => {
            if (a.range.start.line !== b.range.start.line) {
                return a.range.start.line - b.range.start.line;
            }
            if (a.range.start.character !== b.range.start.character) {
                return a.range.start.character - b.range.start.character;
            }
            if (a.range.end.line !== b.range.end.line) {
                return a.range.end.line - b.range.end.line;
            }
            return a.range.end.character - b.range.end.character;
        });
        return symbols.map((symbol) => {
            const tree = OutlineViewAdapter.hierarchicalSymbolToOutline(symbol);
            if (symbol.children != null) {
                tree.children = OutlineViewAdapter.createHierarchicalOutlineTrees(symbol.children);
            }
            return tree;
        });
    }
    // Public: Create an {Array} of {OutlineTree}s from the Array of {SymbolInformation} recieved
    // from the language server. This includes determining the appropriate child and parent
    // relationships for the hierarchy.
    //
    // * `symbols` An {Array} of {SymbolInformation}s received from the language server that
    //             should be converted to an {OutlineTree}.
    //
    // Returns an {OutlineTree} containing the given symbols that the Outline View can display.
    static createOutlineTrees(symbols) {
        symbols.sort((a, b) => (a.location.range.start.line === b.location.range.start.line
            ? a.location.range.start.character - b.location.range.start.character
            : a.location.range.start.line - b.location.range.start.line));
        // Temporarily keep containerName through the conversion process
        // Also filter out symbols without a name - it's part of the spec but some don't include it
        const allItems = symbols.filter((symbol) => symbol.name).map((symbol) => ({
            containerName: symbol.containerName,
            outline: OutlineViewAdapter.symbolToOutline(symbol),
        }));
        // Create a map of containers by name with all items that have that name
        const containers = allItems.reduce((map, item) => {
            const name = item.outline.representativeName;
            if (name != null) {
                const container = map.get(name);
                if (container == null) {
                    map.set(name, [item.outline]);
                }
                else {
                    container.push(item.outline);
                }
            }
            return map;
        }, new Map());
        const roots = [];
        // Put each item within its parent and extract out the roots
        for (const item of allItems) {
            const containerName = item.containerName;
            const child = item.outline;
            if (containerName == null || containerName === '') {
                roots.push(item.outline);
            }
            else {
                const possibleParents = containers.get(containerName);
                let closestParent = OutlineViewAdapter._getClosestParent(possibleParents, child);
                if (closestParent == null) {
                    closestParent = {
                        plainText: containerName,
                        representativeName: containerName,
                        startPosition: new atom_1.Point(0, 0),
                        children: [child],
                    };
                    roots.push(closestParent);
                    if (possibleParents == null) {
                        containers.set(containerName, [closestParent]);
                    }
                    else {
                        possibleParents.push(closestParent);
                    }
                }
                else {
                    closestParent.children.push(child);
                }
            }
        }
        return roots;
    }
    static _getClosestParent(candidates, child) {
        if (candidates == null || candidates.length === 0) {
            return null;
        }
        let parent;
        for (const candidate of candidates) {
            if (candidate !== child &&
                candidate.startPosition.isLessThanOrEqual(child.startPosition) &&
                (candidate.endPosition === undefined ||
                    (child.endPosition && candidate.endPosition.isGreaterThanOrEqual(child.endPosition)))) {
                if (parent === undefined ||
                    (parent.startPosition.isLessThanOrEqual(candidate.startPosition) ||
                        (parent.endPosition != null &&
                            candidate.endPosition &&
                            parent.endPosition.isGreaterThanOrEqual(candidate.endPosition)))) {
                    parent = candidate;
                }
            }
        }
        return parent || null;
    }
    // Public: Convert an individual {DocumentSymbol} from the language server
    // to an {OutlineTree} for use by the Outline View. It does NOT recursively
    // process the given symbol's children (if any).
    //
    // * `symbol` The {DocumentSymbol} to convert to an {OutlineTree}.
    //
    // Returns the {OutlineTree} corresponding to the given {DocumentSymbol}.
    static hierarchicalSymbolToOutline(symbol) {
        const icon = OutlineViewAdapter.symbolKindToEntityKind(symbol.kind);
        return {
            tokenizedText: [
                {
                    kind: OutlineViewAdapter.symbolKindToTokenKind(symbol.kind),
                    value: symbol.name,
                },
            ],
            icon: icon != null ? icon : undefined,
            representativeName: symbol.name,
            startPosition: convert_1.default.positionToPoint(symbol.selectionRange.start),
            endPosition: convert_1.default.positionToPoint(symbol.selectionRange.end),
            children: [],
        };
    }
    // Public: Convert an individual {SymbolInformation} from the language server
    // to an {OutlineTree} for use by the Outline View.
    //
    // * `symbol` The {SymbolInformation} to convert to an {OutlineTree}.
    //
    // Returns the {OutlineTree} equivalent to the given {SymbolInformation}.
    static symbolToOutline(symbol) {
        const icon = OutlineViewAdapter.symbolKindToEntityKind(symbol.kind);
        return {
            tokenizedText: [
                {
                    kind: OutlineViewAdapter.symbolKindToTokenKind(symbol.kind),
                    value: symbol.name,
                },
            ],
            icon: icon != null ? icon : undefined,
            representativeName: symbol.name,
            startPosition: convert_1.default.positionToPoint(symbol.location.range.start),
            endPosition: convert_1.default.positionToPoint(symbol.location.range.end),
            children: [],
        };
    }
    // Public: Convert a symbol kind into an outline entity kind used to determine
    // the styling such as the appropriate icon in the Outline View.
    //
    // * `symbol` The numeric symbol kind received from the language server.
    //
    // Returns a string representing the equivalent OutlineView entity kind.
    static symbolKindToEntityKind(symbol) {
        switch (symbol) {
            case languageclient_1.SymbolKind.Array:
                return 'type-array';
            case languageclient_1.SymbolKind.Boolean:
                return 'type-boolean';
            case languageclient_1.SymbolKind.Class:
                return 'type-class';
            case languageclient_1.SymbolKind.Constant:
                return 'type-constant';
            case languageclient_1.SymbolKind.Constructor:
                return 'type-constructor';
            case languageclient_1.SymbolKind.Enum:
                return 'type-enum';
            case languageclient_1.SymbolKind.Field:
                return 'type-field';
            case languageclient_1.SymbolKind.File:
                return 'type-file';
            case languageclient_1.SymbolKind.Function:
                return 'type-function';
            case languageclient_1.SymbolKind.Interface:
                return 'type-interface';
            case languageclient_1.SymbolKind.Method:
                return 'type-method';
            case languageclient_1.SymbolKind.Module:
                return 'type-module';
            case languageclient_1.SymbolKind.Namespace:
                return 'type-namespace';
            case languageclient_1.SymbolKind.Number:
                return 'type-number';
            case languageclient_1.SymbolKind.Package:
                return 'type-package';
            case languageclient_1.SymbolKind.Property:
                return 'type-property';
            case languageclient_1.SymbolKind.String:
                return 'type-string';
            case languageclient_1.SymbolKind.Variable:
                return 'type-variable';
            case languageclient_1.SymbolKind.Struct:
                return 'type-class';
            case languageclient_1.SymbolKind.EnumMember:
                return 'type-constant';
            default:
                return null;
        }
    }
    // Public: Convert a symbol kind to the appropriate token kind used to syntax
    // highlight the symbol name in the Outline View.
    //
    // * `symbol` The numeric symbol kind received from the language server.
    //
    // Returns a string representing the equivalent syntax token kind.
    static symbolKindToTokenKind(symbol) {
        switch (symbol) {
            case languageclient_1.SymbolKind.Class:
                return 'type';
            case languageclient_1.SymbolKind.Constructor:
                return 'constructor';
            case languageclient_1.SymbolKind.Method:
            case languageclient_1.SymbolKind.Function:
                return 'method';
            case languageclient_1.SymbolKind.String:
                return 'string';
            default:
                return 'plain';
        }
    }
}
exports.default = OutlineViewAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS12aWV3LWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvb3V0bGluZS12aWV3LWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLHdDQUFpQztBQUNqQyxrQ0FBa0M7QUFFbEMsc0RBTTJCO0FBQzNCLCtCQUdjO0FBRWQsdUZBQXVGO0FBQ3ZGLDJCQUEyQjtBQUMzQixNQUFxQixrQkFBa0I7SUFBdkM7UUFFVSx3QkFBbUIsR0FBK0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztJQW9UMUcsQ0FBQztJQWxUQyxnRkFBZ0Y7SUFDaEYsOEVBQThFO0lBQzlFLEVBQUU7SUFDRixzRkFBc0Y7SUFDdEYsRUFBRTtJQUNGLDJFQUEyRTtJQUMzRSw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxzQkFBc0IsS0FBSyxJQUFJLENBQUM7SUFDNUQsQ0FBQztJQUVELDJGQUEyRjtJQUMzRix1QkFBdUI7SUFDdkIsRUFBRTtJQUNGLDBGQUEwRjtJQUMxRixrQ0FBa0M7SUFDbEMscUZBQXFGO0lBQ3JGLEVBQUU7SUFDRixpRUFBaUU7SUFDcEQsVUFBVSxDQUFDLFVBQW9DLEVBQUUsTUFBa0I7O1lBQzlFLE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQzlHLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBQyxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsRUFBQyxFQUFFLGlCQUFpQixDQUFDLENBQzdHLENBQUM7WUFFRixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN4QixPQUFPO29CQUNMLFlBQVksRUFBRSxFQUFFO2lCQUNqQixD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TUFBTTtnQkFDcEIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLE9BQU87Z0JBQ3JCLE9BQU8sY0FBYyxDQUFDO1lBQ3hCLEtBQUssMkJBQVUsQ0FBQyxRQUFRO2dCQUN0QixPQUFPLGVBQWUsQ0FBQztZQUN6QixLQUFLLDJCQUFVLENBQUMsTUFBTTtnQkFDcEIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLFFBQVE7Z0JBQ3RCLE9BQU8sZUFBZSxDQUFDO1lBQ3pCLEtBQUssMkJBQVUsQ0FBQyxNQUFNO2dCQUNwQixPQUFPLFlBQVksQ0FBQztZQUN0QixLQUFLLDJCQUFVLENBQUMsVUFBVTtnQkFDeEIsT0FBTyxlQUFlLENBQUM7WUFDekI7Z0JBQ0UsT0FBTyxJQUFJLENBQUM7U0FDZjtJQUNILENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsaURBQWlEO0lBQ2pELEVBQUU7SUFDRix3RUFBd0U7SUFDeEUsRUFBRTtJQUNGLGtFQUFrRTtJQUMzRCxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBYztRQUNoRCxRQUFRLE1BQU0sRUFBRTtZQUNkLEtBQUssMkJBQVUsQ0FBQyxLQUFLO2dCQUNuQixPQUFPLE1BQU0sQ0FBQztZQUNoQixLQUFLLDJCQUFVLENBQUMsV0FBVztnQkFDekIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLE1BQU0sQ0FBQztZQUN2QixLQUFLLDJCQUFVLENBQUMsUUFBUTtnQkFDdEIsT0FBTyxRQUFRLENBQUM7WUFDbEIsS0FBSywyQkFBVSxDQUFDLE1BQU07Z0JBQ3BCLE9BQU8sUUFBUSxDQUFDO1lBQ2xCO2dCQUNFLE9BQU8sT0FBTyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztDQUNGO0FBdFRELHFDQXNUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xyXG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xyXG5pbXBvcnQgeyBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSB9IGZyb20gJ3ZzY29kZS1qc29ucnBjJztcclxuaW1wb3J0IHtcclxuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXHJcbiAgU3ltYm9sS2luZCxcclxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXHJcbiAgU3ltYm9sSW5mb3JtYXRpb24sXHJcbiAgRG9jdW1lbnRTeW1ib2wsXHJcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5pbXBvcnQge1xyXG4gIFBvaW50LFxyXG4gIFRleHRFZGl0b3IsXHJcbn0gZnJvbSAnYXRvbSc7XHJcblxyXG4vLyBQdWJsaWM6IEFkYXB0cyB0aGUgZG9jdW1lbnRTeW1ib2xQcm92aWRlciBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIHRoZSBPdXRsaW5lIFZpZXdcclxuLy8gc3VwcGxpZWQgYnkgQXRvbSBJREUgVUkuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dGxpbmVWaWV3QWRhcHRlciB7XHJcblxyXG4gIHByaXZhdGUgX2NhbmNlbGxhdGlvblRva2VuczogV2Vha01hcDxMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sIENhbmNlbGxhdGlvblRva2VuU291cmNlPiA9IG5ldyBXZWFrTWFwKCk7XHJcblxyXG4gIC8vIFB1YmxpYzogRGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBhZGFwdGVyIGNhbiBiZSB1c2VkIHRvIGFkYXB0IGEgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgLy8gYmFzZWQgb24gdGhlIHNlcnZlckNhcGFiaWxpdGllcyBtYXRyaXggY29udGFpbmluZyBhIGRvY3VtZW50U3ltYm9sUHJvdmlkZXIuXHJcbiAgLy9cclxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIGNvbnNpZGVyLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXHJcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRTeW1ib2xQcm92aWRlciA9PT0gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogT2J0YWluIHRoZSBPdXRsaW5lIGZvciBkb2N1bWVudCB2aWEgdGhlIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IGFzIGlkZW50aWZpZWRcclxuICAvLyBieSB0aGUge1RleHRFZGl0b3J9LlxyXG4gIC8vXHJcbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSBxdWVyaWVkXHJcbiAgLy8gICAgICAgICAgICAgICAgZm9yIHRoZSBvdXRsaW5lLlxyXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHRleHQgdGhlIE91dGxpbmUgc2hvdWxkIHJlcHJlc2VudC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge091dGxpbmV9IG9mIHRoaXMgZG9jdW1lbnQuXHJcbiAgcHVibGljIGFzeW5jIGdldE91dGxpbmUoY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLCBlZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPGF0b21JZGUuT3V0bGluZSB8IG51bGw+IHtcclxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBVdGlscy5kb1dpdGhDYW5jZWxsYXRpb25Ub2tlbihjb25uZWN0aW9uLCB0aGlzLl9jYW5jZWxsYXRpb25Ub2tlbnMsIChjYW5jZWxsYXRpb25Ub2tlbikgPT5cclxuICAgICAgY29ubmVjdGlvbi5kb2N1bWVudFN5bWJvbCh7dGV4dERvY3VtZW50OiBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50SWRlbnRpZmllcihlZGl0b3IpfSwgY2FuY2VsbGF0aW9uVG9rZW4pLFxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBvdXRsaW5lVHJlZXM6IFtdLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgocmVzdWx0c1swXSBhcyBEb2N1bWVudFN5bWJvbCkuc2VsZWN0aW9uUmFuZ2UgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBJZiB0aGUgc2VydmVyIGlzIGdpdmluZyBiYWNrIHRoZSBuZXdlciBEb2N1bWVudFN5bWJvbCBmb3JtYXQuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgb3V0bGluZVRyZWVzOiBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlSGllcmFyY2hpY2FsT3V0bGluZVRyZWVzKFxyXG4gICAgICAgICAgcmVzdWx0cyBhcyBEb2N1bWVudFN5bWJvbFtdKSxcclxuICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIElmIHRoZSBzZXJ2ZXIgaXMgZ2l2aW5nIGJhY2sgdGhlIG9yaWdpbmFsIFN5bWJvbEluZm9ybWF0aW9uIGZvcm1hdC5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBvdXRsaW5lVHJlZXM6IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVPdXRsaW5lVHJlZXMoXHJcbiAgICAgICAgICByZXN1bHRzIGFzIFN5bWJvbEluZm9ybWF0aW9uW10pLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDcmVhdGUgYW4ge0FycmF5fSBvZiB7T3V0bGluZVRyZWV9cyBmcm9tIHRoZSBBcnJheSBvZiB7RG9jdW1lbnRTeW1ib2x9IHJlY2lldmVkXHJcbiAgLy8gZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLiBUaGlzIGluY2x1ZGVzIGNvbnZlcnRpbmcgYWxsIHRoZSBjaGlsZHJlbiBub2RlcyBpbiB0aGUgZW50aXJlXHJcbiAgLy8gaGllcmFyY2h5LlxyXG4gIC8vXHJcbiAgLy8gKiBgc3ltYm9sc2AgQW4ge0FycmF5fSBvZiB7RG9jdW1lbnRTeW1ib2x9cyByZWNlaXZlZCBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdFxyXG4gIC8vICAgICAgICAgICAgIHNob3VsZCBiZSBjb252ZXJ0ZWQgdG8gYW4ge0FycmF5fSBvZiB7T3V0bGluZVRyZWV9LlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhbiB7QXJyYXl9IG9mIHtPdXRsaW5lVHJlZX0gY29udGFpbmluZyB0aGUgZ2l2ZW4gc3ltYm9scyB0aGF0IHRoZSBPdXRsaW5lIFZpZXcgY2FuIGRpc3BsYXkuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVIaWVyYXJjaGljYWxPdXRsaW5lVHJlZXMoc3ltYm9sczogRG9jdW1lbnRTeW1ib2xbXSk6IGF0b21JZGUuT3V0bGluZVRyZWVbXSB7XHJcbiAgICAvLyBTb3J0IGFsbCB0aGUgaW5jb21pbmcgc3ltYm9sc1xyXG4gICAgc3ltYm9scy5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgIGlmIChhLnJhbmdlLnN0YXJ0LmxpbmUgIT09IGIucmFuZ2Uuc3RhcnQubGluZSkge1xyXG4gICAgICAgIHJldHVybiBhLnJhbmdlLnN0YXJ0LmxpbmUgLSBiLnJhbmdlLnN0YXJ0LmxpbmU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChhLnJhbmdlLnN0YXJ0LmNoYXJhY3RlciAhPT0gYi5yYW5nZS5zdGFydC5jaGFyYWN0ZXIpIHtcclxuICAgICAgICByZXR1cm4gYS5yYW5nZS5zdGFydC5jaGFyYWN0ZXIgLSBiLnJhbmdlLnN0YXJ0LmNoYXJhY3RlcjtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGEucmFuZ2UuZW5kLmxpbmUgIT09IGIucmFuZ2UuZW5kLmxpbmUpIHtcclxuICAgICAgICByZXR1cm4gYS5yYW5nZS5lbmQubGluZSAtIGIucmFuZ2UuZW5kLmxpbmU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBhLnJhbmdlLmVuZC5jaGFyYWN0ZXIgLSBiLnJhbmdlLmVuZC5jaGFyYWN0ZXI7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gc3ltYm9scy5tYXAoKHN5bWJvbCkgPT4ge1xyXG4gICAgICBjb25zdCB0cmVlID0gT3V0bGluZVZpZXdBZGFwdGVyLmhpZXJhcmNoaWNhbFN5bWJvbFRvT3V0bGluZShzeW1ib2wpO1xyXG5cclxuICAgICAgaWYgKHN5bWJvbC5jaGlsZHJlbiAhPSBudWxsKSB7XHJcbiAgICAgICAgdHJlZS5jaGlsZHJlbiA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVIaWVyYXJjaGljYWxPdXRsaW5lVHJlZXMoXHJcbiAgICAgICAgICBzeW1ib2wuY2hpbGRyZW4pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdHJlZTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDcmVhdGUgYW4ge0FycmF5fSBvZiB7T3V0bGluZVRyZWV9cyBmcm9tIHRoZSBBcnJheSBvZiB7U3ltYm9sSW5mb3JtYXRpb259IHJlY2lldmVkXHJcbiAgLy8gZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLiBUaGlzIGluY2x1ZGVzIGRldGVybWluaW5nIHRoZSBhcHByb3ByaWF0ZSBjaGlsZCBhbmQgcGFyZW50XHJcbiAgLy8gcmVsYXRpb25zaGlwcyBmb3IgdGhlIGhpZXJhcmNoeS5cclxuICAvL1xyXG4gIC8vICogYHN5bWJvbHNgIEFuIHtBcnJheX0gb2Yge1N5bWJvbEluZm9ybWF0aW9ufXMgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXRcclxuICAvLyAgICAgICAgICAgICBzaG91bGQgYmUgY29udmVydGVkIHRvIGFuIHtPdXRsaW5lVHJlZX0uXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGFuIHtPdXRsaW5lVHJlZX0gY29udGFpbmluZyB0aGUgZ2l2ZW4gc3ltYm9scyB0aGF0IHRoZSBPdXRsaW5lIFZpZXcgY2FuIGRpc3BsYXkuXHJcbiAgcHVibGljIHN0YXRpYyBjcmVhdGVPdXRsaW5lVHJlZXMoc3ltYm9sczogU3ltYm9sSW5mb3JtYXRpb25bXSk6IGF0b21JZGUuT3V0bGluZVRyZWVbXSB7XHJcbiAgICBzeW1ib2xzLnNvcnQoXHJcbiAgICAgIChhLCBiKSA9PlxyXG4gICAgICAgIChhLmxvY2F0aW9uLnJhbmdlLnN0YXJ0LmxpbmUgPT09IGIubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZVxyXG4gICAgICAgICAgPyBhLmxvY2F0aW9uLnJhbmdlLnN0YXJ0LmNoYXJhY3RlciAtIGIubG9jYXRpb24ucmFuZ2Uuc3RhcnQuY2hhcmFjdGVyXHJcbiAgICAgICAgICA6IGEubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZSAtIGIubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZSksXHJcbiAgICApO1xyXG5cclxuICAgIC8vIFRlbXBvcmFyaWx5IGtlZXAgY29udGFpbmVyTmFtZSB0aHJvdWdoIHRoZSBjb252ZXJzaW9uIHByb2Nlc3NcclxuICAgIC8vIEFsc28gZmlsdGVyIG91dCBzeW1ib2xzIHdpdGhvdXQgYSBuYW1lIC0gaXQncyBwYXJ0IG9mIHRoZSBzcGVjIGJ1dCBzb21lIGRvbid0IGluY2x1ZGUgaXRcclxuICAgIGNvbnN0IGFsbEl0ZW1zID0gc3ltYm9scy5maWx0ZXIoKHN5bWJvbCkgPT4gc3ltYm9sLm5hbWUpLm1hcCgoc3ltYm9sKSA9PiAoe1xyXG4gICAgICBjb250YWluZXJOYW1lOiBzeW1ib2wuY29udGFpbmVyTmFtZSxcclxuICAgICAgb3V0bGluZTogT3V0bGluZVZpZXdBZGFwdGVyLnN5bWJvbFRvT3V0bGluZShzeW1ib2wpLFxyXG4gICAgfSkpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhIG1hcCBvZiBjb250YWluZXJzIGJ5IG5hbWUgd2l0aCBhbGwgaXRlbXMgdGhhdCBoYXZlIHRoYXQgbmFtZVxyXG4gICAgY29uc3QgY29udGFpbmVycyA9IGFsbEl0ZW1zLnJlZHVjZSgobWFwLCBpdGVtKSA9PiB7XHJcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLm91dGxpbmUucmVwcmVzZW50YXRpdmVOYW1lO1xyXG4gICAgICBpZiAobmFtZSAhPSBudWxsKSB7XHJcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gbWFwLmdldChuYW1lKTtcclxuICAgICAgICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcclxuICAgICAgICAgIG1hcC5zZXQobmFtZSwgW2l0ZW0ub3V0bGluZV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb250YWluZXIucHVzaChpdGVtLm91dGxpbmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbWFwO1xyXG4gICAgfSwgbmV3IE1hcCgpKTtcclxuXHJcbiAgICBjb25zdCByb290czogYXRvbUlkZS5PdXRsaW5lVHJlZVtdID0gW107XHJcblxyXG4gICAgLy8gUHV0IGVhY2ggaXRlbSB3aXRoaW4gaXRzIHBhcmVudCBhbmQgZXh0cmFjdCBvdXQgdGhlIHJvb3RzXHJcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcclxuICAgICAgY29uc3QgY29udGFpbmVyTmFtZSA9IGl0ZW0uY29udGFpbmVyTmFtZTtcclxuICAgICAgY29uc3QgY2hpbGQgPSBpdGVtLm91dGxpbmU7XHJcbiAgICAgIGlmIChjb250YWluZXJOYW1lID09IG51bGwgfHwgY29udGFpbmVyTmFtZSA9PT0gJycpIHtcclxuICAgICAgICByb290cy5wdXNoKGl0ZW0ub3V0bGluZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgcG9zc2libGVQYXJlbnRzID0gY29udGFpbmVycy5nZXQoY29udGFpbmVyTmFtZSk7XHJcbiAgICAgICAgbGV0IGNsb3Nlc3RQYXJlbnQgPSBPdXRsaW5lVmlld0FkYXB0ZXIuX2dldENsb3Nlc3RQYXJlbnQocG9zc2libGVQYXJlbnRzLCBjaGlsZCk7XHJcbiAgICAgICAgaWYgKGNsb3Nlc3RQYXJlbnQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgY2xvc2VzdFBhcmVudCA9IHtcclxuICAgICAgICAgICAgcGxhaW5UZXh0OiBjb250YWluZXJOYW1lLFxyXG4gICAgICAgICAgICByZXByZXNlbnRhdGl2ZU5hbWU6IGNvbnRhaW5lck5hbWUsXHJcbiAgICAgICAgICAgIHN0YXJ0UG9zaXRpb246IG5ldyBQb2ludCgwLCAwKSxcclxuICAgICAgICAgICAgY2hpbGRyZW46IFtjaGlsZF0sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcm9vdHMucHVzaChjbG9zZXN0UGFyZW50KTtcclxuICAgICAgICAgIGlmIChwb3NzaWJsZVBhcmVudHMgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb250YWluZXJzLnNldChjb250YWluZXJOYW1lLCBbY2xvc2VzdFBhcmVudF0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcG9zc2libGVQYXJlbnRzLnB1c2goY2xvc2VzdFBhcmVudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGNsb3Nlc3RQYXJlbnQuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJvb3RzO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzdGF0aWMgX2dldENsb3Nlc3RQYXJlbnQoXHJcbiAgICBjYW5kaWRhdGVzOiBhdG9tSWRlLk91dGxpbmVUcmVlW10gfCBudWxsLFxyXG4gICAgY2hpbGQ6IGF0b21JZGUuT3V0bGluZVRyZWUsXHJcbiAgKTogYXRvbUlkZS5PdXRsaW5lVHJlZSB8IG51bGwge1xyXG4gICAgaWYgKGNhbmRpZGF0ZXMgPT0gbnVsbCB8fCBjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcGFyZW50OiBhdG9tSWRlLk91dGxpbmVUcmVlIHwgdW5kZWZpbmVkO1xyXG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgY2FuZGlkYXRlICE9PSBjaGlsZCAmJlxyXG4gICAgICAgIGNhbmRpZGF0ZS5zdGFydFBvc2l0aW9uLmlzTGVzc1RoYW5PckVxdWFsKGNoaWxkLnN0YXJ0UG9zaXRpb24pICYmXHJcbiAgICAgICAgKGNhbmRpZGF0ZS5lbmRQb3NpdGlvbiA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgICAoY2hpbGQuZW5kUG9zaXRpb24gJiYgY2FuZGlkYXRlLmVuZFBvc2l0aW9uLmlzR3JlYXRlclRoYW5PckVxdWFsKGNoaWxkLmVuZFBvc2l0aW9uKSkpXHJcbiAgICAgICkge1xyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIHBhcmVudCA9PT0gdW5kZWZpbmVkIHx8XHJcbiAgICAgICAgICAocGFyZW50LnN0YXJ0UG9zaXRpb24uaXNMZXNzVGhhbk9yRXF1YWwoY2FuZGlkYXRlLnN0YXJ0UG9zaXRpb24pIHx8XHJcbiAgICAgICAgICAgIChwYXJlbnQuZW5kUG9zaXRpb24gIT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgIGNhbmRpZGF0ZS5lbmRQb3NpdGlvbiAmJlxyXG4gICAgICAgICAgICAgIHBhcmVudC5lbmRQb3NpdGlvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbChjYW5kaWRhdGUuZW5kUG9zaXRpb24pKSlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIHBhcmVudCA9IGNhbmRpZGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcGFyZW50IHx8IG51bGw7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gaW5kaXZpZHVhbCB7RG9jdW1lbnRTeW1ib2x9IGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlclxyXG4gIC8vIHRvIGFuIHtPdXRsaW5lVHJlZX0gZm9yIHVzZSBieSB0aGUgT3V0bGluZSBWaWV3LiBJdCBkb2VzIE5PVCByZWN1cnNpdmVseVxyXG4gIC8vIHByb2Nlc3MgdGhlIGdpdmVuIHN5bWJvbCdzIGNoaWxkcmVuIChpZiBhbnkpLlxyXG4gIC8vXHJcbiAgLy8gKiBgc3ltYm9sYCBUaGUge0RvY3VtZW50U3ltYm9sfSB0byBjb252ZXJ0IHRvIGFuIHtPdXRsaW5lVHJlZX0uXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIHRoZSB7T3V0bGluZVRyZWV9IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIHtEb2N1bWVudFN5bWJvbH0uXHJcbiAgcHVibGljIHN0YXRpYyBoaWVyYXJjaGljYWxTeW1ib2xUb091dGxpbmUoc3ltYm9sOiBEb2N1bWVudFN5bWJvbCk6IGF0b21JZGUuT3V0bGluZVRyZWUge1xyXG4gICAgY29uc3QgaWNvbiA9IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xLaW5kVG9FbnRpdHlLaW5kKHN5bWJvbC5raW5kKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0b2tlbml6ZWRUZXh0OiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAga2luZDogT3V0bGluZVZpZXdBZGFwdGVyLnN5bWJvbEtpbmRUb1Rva2VuS2luZChzeW1ib2wua2luZCksXHJcbiAgICAgICAgICB2YWx1ZTogc3ltYm9sLm5hbWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgaWNvbjogaWNvbiAhPSBudWxsID8gaWNvbiA6IHVuZGVmaW5lZCxcclxuICAgICAgcmVwcmVzZW50YXRpdmVOYW1lOiBzeW1ib2wubmFtZSxcclxuICAgICAgc3RhcnRQb3NpdGlvbjogQ29udmVydC5wb3NpdGlvblRvUG9pbnQoc3ltYm9sLnNlbGVjdGlvblJhbmdlLnN0YXJ0KSxcclxuICAgICAgZW5kUG9zaXRpb246IENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHN5bWJvbC5zZWxlY3Rpb25SYW5nZS5lbmQpLFxyXG4gICAgICBjaGlsZHJlbjogW10sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIGluZGl2aWR1YWwge1N5bWJvbEluZm9ybWF0aW9ufSBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcclxuICAvLyB0byBhbiB7T3V0bGluZVRyZWV9IGZvciB1c2UgYnkgdGhlIE91dGxpbmUgVmlldy5cclxuICAvL1xyXG4gIC8vICogYHN5bWJvbGAgVGhlIHtTeW1ib2xJbmZvcm1hdGlvbn0gdG8gY29udmVydCB0byBhbiB7T3V0bGluZVRyZWV9LlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyB0aGUge091dGxpbmVUcmVlfSBlcXVpdmFsZW50IHRvIHRoZSBnaXZlbiB7U3ltYm9sSW5mb3JtYXRpb259LlxyXG4gIHB1YmxpYyBzdGF0aWMgc3ltYm9sVG9PdXRsaW5lKHN5bWJvbDogU3ltYm9sSW5mb3JtYXRpb24pOiBhdG9tSWRlLk91dGxpbmVUcmVlIHtcclxuICAgIGNvbnN0IGljb24gPSBPdXRsaW5lVmlld0FkYXB0ZXIuc3ltYm9sS2luZFRvRW50aXR5S2luZChzeW1ib2wua2luZCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0b2tlbml6ZWRUZXh0OiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAga2luZDogT3V0bGluZVZpZXdBZGFwdGVyLnN5bWJvbEtpbmRUb1Rva2VuS2luZChzeW1ib2wua2luZCksXHJcbiAgICAgICAgICB2YWx1ZTogc3ltYm9sLm5hbWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgICAgaWNvbjogaWNvbiAhPSBudWxsID8gaWNvbiA6IHVuZGVmaW5lZCxcclxuICAgICAgcmVwcmVzZW50YXRpdmVOYW1lOiBzeW1ib2wubmFtZSxcclxuICAgICAgc3RhcnRQb3NpdGlvbjogQ29udmVydC5wb3NpdGlvblRvUG9pbnQoc3ltYm9sLmxvY2F0aW9uLnJhbmdlLnN0YXJ0KSxcclxuICAgICAgZW5kUG9zaXRpb246IENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHN5bWJvbC5sb2NhdGlvbi5yYW5nZS5lbmQpLFxyXG4gICAgICBjaGlsZHJlbjogW10sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGEgc3ltYm9sIGtpbmQgaW50byBhbiBvdXRsaW5lIGVudGl0eSBraW5kIHVzZWQgdG8gZGV0ZXJtaW5lXHJcbiAgLy8gdGhlIHN0eWxpbmcgc3VjaCBhcyB0aGUgYXBwcm9wcmlhdGUgaWNvbiBpbiB0aGUgT3V0bGluZSBWaWV3LlxyXG4gIC8vXHJcbiAgLy8gKiBgc3ltYm9sYCBUaGUgbnVtZXJpYyBzeW1ib2wga2luZCByZWNlaXZlZCBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZXF1aXZhbGVudCBPdXRsaW5lVmlldyBlbnRpdHkga2luZC5cclxuICBwdWJsaWMgc3RhdGljIHN5bWJvbEtpbmRUb0VudGl0eUtpbmQoc3ltYm9sOiBudW1iZXIpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIHN3aXRjaCAoc3ltYm9sKSB7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5BcnJheTpcclxuICAgICAgICByZXR1cm4gJ3R5cGUtYXJyYXknO1xyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQm9vbGVhbjpcclxuICAgICAgICByZXR1cm4gJ3R5cGUtYm9vbGVhbic7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5DbGFzczpcclxuICAgICAgICByZXR1cm4gJ3R5cGUtY2xhc3MnO1xyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ29uc3RhbnQ6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLWNvbnN0YW50JztcclxuICAgICAgY2FzZSBTeW1ib2xLaW5kLkNvbnN0cnVjdG9yOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1jb25zdHJ1Y3Rvcic7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5FbnVtOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1lbnVtJztcclxuICAgICAgY2FzZSBTeW1ib2xLaW5kLkZpZWxkOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1maWVsZCc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5GaWxlOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1maWxlJztcclxuICAgICAgY2FzZSBTeW1ib2xLaW5kLkZ1bmN0aW9uOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1mdW5jdGlvbic7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5JbnRlcmZhY2U6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLWludGVyZmFjZSc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5NZXRob2Q6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLW1ldGhvZCc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5Nb2R1bGU6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLW1vZHVsZSc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5OYW1lc3BhY2U6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLW5hbWVzcGFjZSc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5OdW1iZXI6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLW51bWJlcic7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5QYWNrYWdlOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1wYWNrYWdlJztcclxuICAgICAgY2FzZSBTeW1ib2xLaW5kLlByb3BlcnR5OlxyXG4gICAgICAgIHJldHVybiAndHlwZS1wcm9wZXJ0eSc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5TdHJpbmc6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlLXN0cmluZyc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5WYXJpYWJsZTpcclxuICAgICAgICByZXR1cm4gJ3R5cGUtdmFyaWFibGUnO1xyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuU3RydWN0OlxyXG4gICAgICAgIHJldHVybiAndHlwZS1jbGFzcyc7XHJcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5FbnVtTWVtYmVyOlxyXG4gICAgICAgIHJldHVybiAndHlwZS1jb25zdGFudCc7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBzeW1ib2wga2luZCB0byB0aGUgYXBwcm9wcmlhdGUgdG9rZW4ga2luZCB1c2VkIHRvIHN5bnRheFxyXG4gIC8vIGhpZ2hsaWdodCB0aGUgc3ltYm9sIG5hbWUgaW4gdGhlIE91dGxpbmUgVmlldy5cclxuICAvL1xyXG4gIC8vICogYHN5bWJvbGAgVGhlIG51bWVyaWMgc3ltYm9sIGtpbmQgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGVxdWl2YWxlbnQgc3ludGF4IHRva2VuIGtpbmQuXHJcbiAgcHVibGljIHN0YXRpYyBzeW1ib2xLaW5kVG9Ub2tlbktpbmQoc3ltYm9sOiBudW1iZXIpOiBhdG9tSWRlLlRva2VuS2luZCB7XHJcbiAgICBzd2l0Y2ggKHN5bWJvbCkge1xyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ2xhc3M6XHJcbiAgICAgICAgcmV0dXJuICd0eXBlJztcclxuICAgICAgY2FzZSBTeW1ib2xLaW5kLkNvbnN0cnVjdG9yOlxyXG4gICAgICAgIHJldHVybiAnY29uc3RydWN0b3InO1xyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuTWV0aG9kOlxyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuRnVuY3Rpb246XHJcbiAgICAgICAgcmV0dXJuICdtZXRob2QnO1xyXG4gICAgICBjYXNlIFN5bWJvbEtpbmQuU3RyaW5nOlxyXG4gICAgICAgIHJldHVybiAnc3RyaW5nJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ3BsYWluJztcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/adapters/signature-help-adapter.js":
/*!***************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/adapters/signature-help-adapter.js ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const assert = __webpack_require__(/*! assert */ "assert");
const convert_1 = __webpack_require__(/*! ../convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class SignatureHelpAdapter {
    constructor(server, grammarScopes) {
        this._disposables = new atom_1.CompositeDisposable();
        this._connection = server.connection;
        this._capabilities = server.capabilities;
        this._grammarScopes = grammarScopes;
    }
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.signatureHelpProvider != null;
    }
    dispose() {
        this._disposables.dispose();
    }
    attach(register) {
        const { signatureHelpProvider } = this._capabilities;
        assert(signatureHelpProvider != null);
        let triggerCharacters;
        if (signatureHelpProvider && Array.isArray(signatureHelpProvider.triggerCharacters)) {
            triggerCharacters = new Set(signatureHelpProvider.triggerCharacters);
        }
        this._disposables.add(register({
            priority: 1,
            grammarScopes: this._grammarScopes,
            triggerCharacters,
            getSignatureHelp: this.getSignatureHelp.bind(this),
        }));
    }
    // Public: Retrieves signature help for a given editor and position.
    getSignatureHelp(editor, point) {
        return this._connection.signatureHelp(convert_1.default.editorToTextDocumentPositionParams(editor, point));
    }
}
exports.default = SignatureHelpAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmF0dXJlLWhlbHAtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9zaWduYXR1cmUtaGVscC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsaUNBQWtDO0FBQ2xDLHdDQUFpQztBQUVqQywrQkFJYztBQU9kLE1BQXFCLG9CQUFvQjtJQU12QyxZQUFZLE1BQW9CLEVBQUUsYUFBdUI7UUFMakQsaUJBQVksR0FBd0IsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBTXBFLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUNyQyxJQUFJLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDekMsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7SUFDdEMsQ0FBQztJQUVELGdGQUFnRjtJQUNoRiw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxxQkFBcUIsSUFBSSxJQUFJLENBQUM7SUFDMUQsQ0FBQztJQUVNLE9BQU87UUFDWixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFTSxNQUFNLENBQUMsUUFBdUM7UUFDbkQsTUFBTSxFQUFDLHFCQUFxQixFQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNuRCxNQUFNLENBQUMscUJBQXFCLElBQUksSUFBSSxDQUFDLENBQUM7UUFFdEMsSUFBSSxpQkFBMEMsQ0FBQztRQUMvQyxJQUFJLHFCQUFxQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsRUFBRTtZQUNuRixpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQ25CLFFBQVEsQ0FBQztZQUNQLFFBQVEsRUFBRSxDQUFDO1lBQ1gsYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjO1lBQ2xDLGlCQUFpQjtZQUNqQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNuRCxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFRCxvRUFBb0U7SUFDN0QsZ0JBQWdCLENBQUMsTUFBa0IsRUFBRSxLQUFZO1FBQ3RELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNuRyxDQUFDO0NBQ0Y7QUE3Q0QsdUNBNkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XHJcbmltcG9ydCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcclxuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XHJcbmltcG9ydCB7IEFjdGl2ZVNlcnZlciB9IGZyb20gJy4uL3NlcnZlci1tYW5hZ2VyJztcclxuaW1wb3J0IHtcclxuICBDb21wb3NpdGVEaXNwb3NhYmxlLFxyXG4gIFBvaW50LFxyXG4gIFRleHRFZGl0b3IsXHJcbn0gZnJvbSAnYXRvbSc7XHJcbmltcG9ydCB7XHJcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxyXG4gIFNlcnZlckNhcGFiaWxpdGllcyxcclxuICBTaWduYXR1cmVIZWxwLFxyXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNpZ25hdHVyZUhlbHBBZGFwdGVyIHtcclxuICBwcml2YXRlIF9kaXNwb3NhYmxlczogQ29tcG9zaXRlRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgcHJpdmF0ZSBfY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uO1xyXG4gIHByaXZhdGUgX2NhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzO1xyXG4gIHByaXZhdGUgX2dyYW1tYXJTY29wZXM6IHN0cmluZ1tdO1xyXG5cclxuICBjb25zdHJ1Y3RvcihzZXJ2ZXI6IEFjdGl2ZVNlcnZlciwgZ3JhbW1hclNjb3Blczogc3RyaW5nW10pIHtcclxuICAgIHRoaXMuX2Nvbm5lY3Rpb24gPSBzZXJ2ZXIuY29ubmVjdGlvbjtcclxuICAgIHRoaXMuX2NhcGFiaWxpdGllcyA9IHNlcnZlci5jYXBhYmlsaXRpZXM7XHJcbiAgICB0aGlzLl9ncmFtbWFyU2NvcGVzID0gZ3JhbW1hclNjb3BlcztcclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgYSB7Qm9vbGVhbn0gaW5kaWNhdGluZyB0aGlzIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXHJcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxyXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuc2lnbmF0dXJlSGVscFByb3ZpZGVyICE9IG51bGw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpIHtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmRpc3Bvc2UoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhdHRhY2gocmVnaXN0ZXI6IGF0b21JZGUuU2lnbmF0dXJlSGVscFJlZ2lzdHJ5KTogdm9pZCB7XHJcbiAgICBjb25zdCB7c2lnbmF0dXJlSGVscFByb3ZpZGVyfSA9IHRoaXMuX2NhcGFiaWxpdGllcztcclxuICAgIGFzc2VydChzaWduYXR1cmVIZWxwUHJvdmlkZXIgIT0gbnVsbCk7XHJcblxyXG4gICAgbGV0IHRyaWdnZXJDaGFyYWN0ZXJzOiBTZXQ8c3RyaW5nPiB8IHVuZGVmaW5lZDtcclxuICAgIGlmIChzaWduYXR1cmVIZWxwUHJvdmlkZXIgJiYgQXJyYXkuaXNBcnJheShzaWduYXR1cmVIZWxwUHJvdmlkZXIudHJpZ2dlckNoYXJhY3RlcnMpKSB7XHJcbiAgICAgIHRyaWdnZXJDaGFyYWN0ZXJzID0gbmV3IFNldChzaWduYXR1cmVIZWxwUHJvdmlkZXIudHJpZ2dlckNoYXJhY3RlcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX2Rpc3Bvc2FibGVzLmFkZChcclxuICAgICAgcmVnaXN0ZXIoe1xyXG4gICAgICAgIHByaW9yaXR5OiAxLFxyXG4gICAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuX2dyYW1tYXJTY29wZXMsXHJcbiAgICAgICAgdHJpZ2dlckNoYXJhY3RlcnMsXHJcbiAgICAgICAgZ2V0U2lnbmF0dXJlSGVscDogdGhpcy5nZXRTaWduYXR1cmVIZWxwLmJpbmQodGhpcyksXHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogUmV0cmlldmVzIHNpZ25hdHVyZSBoZWxwIGZvciBhIGdpdmVuIGVkaXRvciBhbmQgcG9zaXRpb24uXHJcbiAgcHVibGljIGdldFNpZ25hdHVyZUhlbHAoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb2ludDogUG9pbnQpOiBQcm9taXNlPFNpZ25hdHVyZUhlbHAgfCBudWxsPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbi5zaWduYXR1cmVIZWxwKENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtcyhlZGl0b3IsIHBvaW50KSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/auto-languageclient.js":
/*!***************************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/auto-languageclient.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = __webpack_require__(/*! child_process */ "child_process");
const rpc = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/vscode-jsonrpc/lib/main.js");
const path = __webpack_require__(/*! path */ "path");
const convert_js_1 = __webpack_require__(/*! ./convert.js */ "./node_modules/atom-languageclient/build/lib/convert.js");
const apply_edit_adapter_1 = __webpack_require__(/*! ./adapters/apply-edit-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/apply-edit-adapter.js");
const autocomplete_adapter_1 = __webpack_require__(/*! ./adapters/autocomplete-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/autocomplete-adapter.js");
const code_action_adapter_1 = __webpack_require__(/*! ./adapters/code-action-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/code-action-adapter.js");
const code_format_adapter_1 = __webpack_require__(/*! ./adapters/code-format-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/code-format-adapter.js");
const code_highlight_adapter_1 = __webpack_require__(/*! ./adapters/code-highlight-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/code-highlight-adapter.js");
const datatip_adapter_1 = __webpack_require__(/*! ./adapters/datatip-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/datatip-adapter.js");
const definition_adapter_1 = __webpack_require__(/*! ./adapters/definition-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/definition-adapter.js");
const document_sync_adapter_1 = __webpack_require__(/*! ./adapters/document-sync-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/document-sync-adapter.js");
const find_references_adapter_1 = __webpack_require__(/*! ./adapters/find-references-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/find-references-adapter.js");
const linter_push_v2_adapter_1 = __webpack_require__(/*! ./adapters/linter-push-v2-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/linter-push-v2-adapter.js");
const logging_console_adapter_1 = __webpack_require__(/*! ./adapters/logging-console-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/logging-console-adapter.js");
const notifications_adapter_1 = __webpack_require__(/*! ./adapters/notifications-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/notifications-adapter.js");
const outline_view_adapter_1 = __webpack_require__(/*! ./adapters/outline-view-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/outline-view-adapter.js");
const signature_help_adapter_1 = __webpack_require__(/*! ./adapters/signature-help-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/signature-help-adapter.js");
const Utils = __webpack_require__(/*! ./utils */ "./node_modules/atom-languageclient/build/lib/utils.js");
const languageclient_1 = __webpack_require__(/*! ./languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
exports.LanguageClientConnection = languageclient_1.LanguageClientConnection;
const logger_1 = __webpack_require__(/*! ./logger */ "./node_modules/atom-languageclient/build/lib/logger.js");
const server_manager_js_1 = __webpack_require__(/*! ./server-manager.js */ "./node_modules/atom-languageclient/build/lib/server-manager.js");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
// Public: AutoLanguageClient provides a simple way to have all the supported
// Atom-IDE services wired up entirely for you by just subclassing it and
// implementing startServerProcess/getGrammarScopes/getLanguageName and
// getServerName.
class AutoLanguageClient {
    constructor() {
        this._isDeactivating = false;
        this._serverAdapters = new WeakMap();
        this.processStdErr = '';
        this.reportBusyWhile = (title, f) => __awaiter(this, void 0, void 0, function* () {
            if (this.busySignalService) {
                return this.busySignalService.reportBusyWhile(title, f);
            }
            else {
                return this.reportBusyWhileDefault(title, f);
            }
        });
        this.reportBusyWhileDefault = (title, f) => __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`[Started] ${title}`);
            let res;
            try {
                res = yield f();
            }
            finally {
                this.logger.info(`[Finished] ${title}`);
            }
            return res;
        });
    }
    // You must implement these so we know how to deal with your language and server
    // -------------------------------------------------------------------------
    // Return an array of the grammar scopes you handle, e.g. [ 'source.js' ]
    getGrammarScopes() {
        throw Error('Must implement getGrammarScopes when extending AutoLanguageClient');
    }
    // Return the name of the language you support, e.g. 'JavaScript'
    getLanguageName() {
        throw Error('Must implement getLanguageName when extending AutoLanguageClient');
    }
    // Return the name of your server, e.g. 'Eclipse JDT'
    getServerName() {
        throw Error('Must implement getServerName when extending AutoLanguageClient');
    }
    // Start your server process
    startServerProcess(projectPath) {
        throw Error('Must override startServerProcess to start language server process when extending AutoLanguageClient');
    }
    // You might want to override these for different behavior
    // ---------------------------------------------------------------------------
    // Determine whether we should start a server for a given editor if we don't have one yet
    shouldStartForEditor(editor) {
        return this.getGrammarScopes().includes(editor.getGrammar().scopeName);
    }
    // Return the parameters used to initialize a client - you may want to extend capabilities
    getInitializeParams(projectPath, process) {
        return {
            processId: process.pid,
            rootPath: projectPath,
            rootUri: convert_js_1.default.pathToUri(projectPath),
            workspaceFolders: [],
            capabilities: {
                workspace: {
                    applyEdit: true,
                    configuration: false,
                    workspaceEdit: {
                        documentChanges: true,
                    },
                    workspaceFolders: false,
                    didChangeConfiguration: {
                        dynamicRegistration: false,
                    },
                    didChangeWatchedFiles: {
                        dynamicRegistration: false,
                    },
                    symbol: {
                        dynamicRegistration: false,
                    },
                    executeCommand: {
                        dynamicRegistration: false,
                    },
                },
                textDocument: {
                    synchronization: {
                        dynamicRegistration: false,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true,
                    },
                    completion: {
                        dynamicRegistration: false,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: false,
                        },
                        contextSupport: true,
                    },
                    hover: {
                        dynamicRegistration: false,
                    },
                    signatureHelp: {
                        dynamicRegistration: false,
                    },
                    references: {
                        dynamicRegistration: false,
                    },
                    documentHighlight: {
                        dynamicRegistration: false,
                    },
                    documentSymbol: {
                        dynamicRegistration: false,
                        hierarchicalDocumentSymbolSupport: true,
                    },
                    formatting: {
                        dynamicRegistration: false,
                    },
                    rangeFormatting: {
                        dynamicRegistration: false,
                    },
                    onTypeFormatting: {
                        dynamicRegistration: false,
                    },
                    definition: {
                        dynamicRegistration: false,
                    },
                    codeAction: {
                        dynamicRegistration: false,
                    },
                    codeLens: {
                        dynamicRegistration: false,
                    },
                    documentLink: {
                        dynamicRegistration: false,
                    },
                    rename: {
                        dynamicRegistration: false,
                    },
                    // We do not support these features yet.
                    // Need to set to undefined to appease TypeScript weak type detection.
                    implementation: undefined,
                    typeDefinition: undefined,
                    colorProvider: undefined,
                    foldingRange: undefined,
                },
                experimental: {},
            },
        };
    }
    // Early wire-up of listeners before initialize method is sent
    preInitialization(connection) { }
    // Late wire-up of listeners after initialize method has been sent
    postInitialization(server) { }
    // Determine whether to use ipc, stdio or socket to connect to the server
    getConnectionType() {
        return this.socket != null ? 'socket' : 'stdio';
    }
    // Return the name of your root configuration key
    getRootConfigurationKey() {
        return '';
    }
    // Optionally transform the configuration object before it is sent to the server
    mapConfigurationObject(configuration) {
        return configuration;
    }
    // Helper methods that are useful for implementors
    // ---------------------------------------------------------------------------
    // Gets a LanguageClientConnection for a given TextEditor
    getConnectionForEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            return server ? server.connection : null;
        });
    }
    // Restart all active language servers for this language client in the workspace
    restartAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._serverManager.restartAllServers();
        });
    }
    // Default implementation of the rest of the AutoLanguageClient
    // ---------------------------------------------------------------------------
    // Activate does very little for perf reasons - hooks in via ServerManager for later 'activation'
    activate() {
        this._disposable = new atom_1.CompositeDisposable();
        this.name = `${this.getLanguageName()} (${this.getServerName()})`;
        this.logger = this.getLogger();
        this._serverManager = new server_manager_js_1.ServerManager((p) => this.startServer(p), this.logger, (e) => this.shouldStartForEditor(e), (filepath) => this.filterChangeWatchedFiles(filepath), this.reportBusyWhile, this.getServerName());
        this._serverManager.startListening();
        process.on('exit', () => this.exitCleanup.bind(this));
    }
    exitCleanup() {
        this._serverManager.terminate();
    }
    // Deactivate disposes the resources we're using
    deactivate() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isDeactivating = true;
            this._disposable.dispose();
            this._serverManager.stopListening();
            yield this._serverManager.stopAllServers();
        });
    }
    spawnChildNode(args, options = {}) {
        this.logger.debug(`starting child Node "${args.join(' ')}"`);
        options.env = options.env || Object.create(process.env);
        if (options.env) {
            options.env.ELECTRON_RUN_AS_NODE = '1';
            options.env.ELECTRON_NO_ATTACH_CONSOLE = '1';
        }
        return cp.spawn(process.execPath, args, options);
    }
    // LSP logging is only set for warnings & errors by default unless you turn on the core.debugLSP setting
    getLogger() {
        const filter = atom.config.get('core.debugLSP')
            ? logger_1.FilteredLogger.DeveloperLevelFilter
            : logger_1.FilteredLogger.UserLevelFilter;
        return new logger_1.FilteredLogger(new logger_1.ConsoleLogger(this.name), filter);
    }
    // Starts the server by starting the process, then initializing the language server and starting adapters
    startServer(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const process = yield this.reportBusyWhile(`Starting ${this.getServerName()} for ${path.basename(projectPath)}`, () => __awaiter(this, void 0, void 0, function* () { return this.startServerProcess(projectPath); }));
            this.captureServerErrors(process, projectPath);
            const connection = new languageclient_1.LanguageClientConnection(this.createRpcConnection(process), this.logger);
            this.preInitialization(connection);
            const initializeParams = this.getInitializeParams(projectPath, process);
            const initialization = connection.initialize(initializeParams);
            this.reportBusyWhile(`${this.getServerName()} initializing for ${path.basename(projectPath)}`, () => initialization);
            const initializeResponse = yield initialization;
            const newServer = {
                projectPath,
                process,
                connection,
                capabilities: initializeResponse.capabilities,
                disposable: new atom_1.CompositeDisposable(),
            };
            this.postInitialization(newServer);
            connection.initialized();
            connection.on('close', () => {
                if (!this._isDeactivating) {
                    this._serverManager.stopServer(newServer);
                    if (!this._serverManager.hasServerReachedRestartLimit(newServer)) {
                        this.logger.debug(`Restarting language server for project '${newServer.projectPath}'`);
                        this._serverManager.startServer(projectPath);
                    }
                    else {
                        this.logger.warn(`Language server has exceeded auto-restart limit for project '${newServer.projectPath}'`);
                        atom.notifications.addError(
                        // tslint:disable-next-line:max-line-length
                        `The ${this.name} language server has exited and exceeded the restart limit for project '${newServer.projectPath}'`);
                    }
                }
            });
            const configurationKey = this.getRootConfigurationKey();
            if (configurationKey) {
                newServer.disposable.add(atom.config.observe(configurationKey, (config) => {
                    const mappedConfig = this.mapConfigurationObject(config || {});
                    if (mappedConfig) {
                        connection.didChangeConfiguration({
                            settings: mappedConfig,
                        });
                    }
                }));
            }
            this.startExclusiveAdapters(newServer);
            return newServer;
        });
    }
    captureServerErrors(childProcess, projectPath) {
        childProcess.on('error', (err) => this.handleSpawnFailure(err));
        childProcess.on('exit', (code, signal) => this.logger.debug(`exit: code ${code} signal ${signal}`));
        childProcess.stderr.setEncoding('utf8');
        childProcess.stderr.on('data', (chunk) => {
            const errorString = chunk.toString();
            this.handleServerStderr(errorString, projectPath);
            // Keep the last 5 lines for packages to use in messages
            this.processStdErr = (this.processStdErr + errorString)
                .split('\n')
                .slice(-5)
                .join('\n');
        });
    }
    handleSpawnFailure(err) {
        atom.notifications.addError(`${this.getServerName()} language server for ${this.getLanguageName()} unable to start`, {
            dismissable: true,
            description: err.toString(),
        });
    }
    // Creates the RPC connection which can be ipc, socket or stdio
    createRpcConnection(process) {
        let reader;
        let writer;
        const connectionType = this.getConnectionType();
        switch (connectionType) {
            case 'ipc':
                reader = new rpc.IPCMessageReader(process);
                writer = new rpc.IPCMessageWriter(process);
                break;
            case 'socket':
                reader = new rpc.SocketMessageReader(this.socket);
                writer = new rpc.SocketMessageWriter(this.socket);
                break;
            case 'stdio':
                reader = new rpc.StreamMessageReader(process.stdout);
                writer = new rpc.StreamMessageWriter(process.stdin);
                break;
            default:
                return Utils.assertUnreachable(connectionType);
        }
        return rpc.createMessageConnection(reader, writer, {
            log: (...args) => { },
            warn: (...args) => { },
            info: (...args) => { },
            error: (...args) => {
                this.logger.error(args);
            },
        });
    }
    // Start adapters that are not shared between servers
    startExclusiveAdapters(server) {
        apply_edit_adapter_1.default.attach(server.connection);
        notifications_adapter_1.default.attach(server.connection, this.name, server.projectPath);
        if (document_sync_adapter_1.default.canAdapt(server.capabilities)) {
            const docSyncAdapter = new document_sync_adapter_1.default(server.connection, (editor) => this.shouldSyncForEditor(editor, server.projectPath), server.capabilities.textDocumentSync, this.reportBusyWhile);
            server.disposable.add(docSyncAdapter);
        }
        const linterPushV2 = new linter_push_v2_adapter_1.default(server.connection);
        if (this._linterDelegate != null) {
            linterPushV2.attach(this._linterDelegate);
        }
        server.disposable.add(linterPushV2);
        const loggingConsole = new logging_console_adapter_1.default(server.connection);
        if (this._consoleDelegate != null) {
            loggingConsole.attach(this._consoleDelegate({ id: this.name, name: 'abc' }));
        }
        server.disposable.add(loggingConsole);
        let signatureHelpAdapter;
        if (signature_help_adapter_1.default.canAdapt(server.capabilities)) {
            signatureHelpAdapter = new signature_help_adapter_1.default(server, this.getGrammarScopes());
            if (this._signatureHelpRegistry != null) {
                signatureHelpAdapter.attach(this._signatureHelpRegistry);
            }
            server.disposable.add(signatureHelpAdapter);
        }
        this._serverAdapters.set(server, {
            linterPushV2, loggingConsole, signatureHelpAdapter,
        });
    }
    shouldSyncForEditor(editor, projectPath) {
        return this.isFileInProject(editor, projectPath) && this.shouldStartForEditor(editor);
    }
    isFileInProject(editor, projectPath) {
        return (editor.getPath() || '').startsWith(projectPath);
    }
    // Autocomplete+ via LS completion---------------------------------------
    provideAutocomplete() {
        return {
            selector: this.getGrammarScopes()
                .map((g) => g.includes('.') ? '.' + g : g)
                .join(', '),
            inclusionPriority: 1,
            suggestionPriority: 2,
            excludeLowerPriority: false,
            getSuggestions: this.getSuggestions.bind(this),
            onDidInsertSuggestion: this.onDidInsertSuggestion.bind(this),
            getSuggestionDetailsOnSelect: this.getSuggestionDetailsOnSelect.bind(this),
        };
    }
    getSuggestions(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(request.editor);
            if (server == null || !autocomplete_adapter_1.default.canAdapt(server.capabilities)) {
                return [];
            }
            this.autoComplete = this.autoComplete || new autocomplete_adapter_1.default();
            this._lastAutocompleteRequest = request;
            return this.autoComplete.getSuggestions(server, request, this.onDidConvertAutocomplete, atom.config.get('autocomplete-plus.minimumWordLength'));
        });
    }
    getSuggestionDetailsOnSelect(suggestion) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = this._lastAutocompleteRequest;
            if (request == null) {
                return null;
            }
            const server = yield this._serverManager.getServer(request.editor);
            if (server == null || !autocomplete_adapter_1.default.canResolve(server.capabilities) || this.autoComplete == null) {
                return null;
            }
            return this.autoComplete.completeSuggestion(server, suggestion, request, this.onDidConvertAutocomplete);
        });
    }
    onDidConvertAutocomplete(completionItem, suggestion, request) {
    }
    onDidInsertSuggestion(arg) { }
    // Definitions via LS documentHighlight and gotoDefinition------------
    provideDefinitions() {
        return {
            name: this.name,
            priority: 20,
            grammarScopes: this.getGrammarScopes(),
            getDefinition: this.getDefinition.bind(this),
        };
    }
    getDefinition(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !definition_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.definitions = this.definitions || new definition_adapter_1.default();
            return this.definitions.getDefinition(server.connection, server.capabilities, this.getLanguageName(), editor, point);
        });
    }
    // Outline View via LS documentSymbol---------------------------------
    provideOutlines() {
        return {
            name: this.name,
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            getOutline: this.getOutline.bind(this),
        };
    }
    getOutline(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !outline_view_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.outlineView = this.outlineView || new outline_view_adapter_1.default();
            return this.outlineView.getOutline(server.connection, editor);
        });
    }
    // Linter push v2 API via LS publishDiagnostics
    consumeLinterV2(registerIndie) {
        this._linterDelegate = registerIndie({ name: this.name });
        if (this._linterDelegate == null) {
            return;
        }
        for (const server of this._serverManager.getActiveServers()) {
            const linterPushV2 = this.getServerAdapter(server, 'linterPushV2');
            if (linterPushV2 != null) {
                linterPushV2.attach(this._linterDelegate);
            }
        }
    }
    // Find References via LS findReferences------------------------------
    provideFindReferences() {
        return {
            isEditorSupported: (editor) => this.getGrammarScopes().includes(editor.getGrammar().scopeName),
            findReferences: this.getReferences.bind(this),
        };
    }
    getReferences(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !find_references_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.findReferences = this.findReferences || new find_references_adapter_1.default();
            return this.findReferences.getReferences(server.connection, editor, point, server.projectPath);
        });
    }
    // Datatip via LS textDocument/hover----------------------------------
    consumeDatatip(service) {
        this._disposable.add(service.addProvider({
            providerName: this.name,
            priority: 1,
            grammarScopes: this.getGrammarScopes(),
            validForScope: (scopeName) => {
                return this.getGrammarScopes().includes(scopeName);
            },
            datatip: this.getDatatip.bind(this),
        }));
    }
    getDatatip(editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !datatip_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            this.datatip = this.datatip || new datatip_adapter_1.default();
            return this.datatip.getDatatip(server.connection, editor, point);
        });
    }
    // Console via LS logging---------------------------------------------
    consumeConsole(createConsole) {
        this._consoleDelegate = createConsole;
        for (const server of this._serverManager.getActiveServers()) {
            const loggingConsole = this.getServerAdapter(server, 'loggingConsole');
            if (loggingConsole) {
                loggingConsole.attach(this._consoleDelegate({ id: this.name, name: 'abc' }));
            }
        }
        // No way of detaching from client connections today
        return new atom_1.Disposable(() => { });
    }
    // Code Format via LS formatDocument & formatDocumentRange------------
    provideCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatCode: this.getCodeFormat.bind(this),
        };
    }
    getCodeFormat(editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_format_adapter_1.default.canAdapt(server.capabilities)) {
                return [];
            }
            return code_format_adapter_1.default.format(server.connection, server.capabilities, editor, range);
        });
    }
    provideRangeCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatCode: this.getRangeCodeFormat.bind(this),
        };
    }
    getRangeCodeFormat(editor, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !server.capabilities.documentRangeFormattingProvider) {
                return [];
            }
            return code_format_adapter_1.default.formatRange(server.connection, editor, range);
        });
    }
    provideFileCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatEntireFile: this.getFileCodeFormat.bind(this),
        };
    }
    provideOnSaveCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatOnSave: this.getFileCodeFormat.bind(this),
        };
    }
    getFileCodeFormat(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !server.capabilities.documentFormattingProvider) {
                return [];
            }
            return code_format_adapter_1.default.formatDocument(server.connection, editor);
        });
    }
    provideOnTypeCodeFormat() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            formatAtPosition: this.getOnTypeCodeFormat.bind(this),
        };
    }
    getOnTypeCodeFormat(editor, point, character) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !server.capabilities.documentOnTypeFormattingProvider) {
                return [];
            }
            return code_format_adapter_1.default.formatOnType(server.connection, editor, point, character);
        });
    }
    provideCodeHighlight() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            highlight: (editor, position) => {
                return this.getCodeHighlight(editor, position);
            },
        };
    }
    getCodeHighlight(editor, position) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_highlight_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            return code_highlight_adapter_1.default.highlight(server.connection, server.capabilities, editor, position);
        });
    }
    provideCodeActions() {
        return {
            grammarScopes: this.getGrammarScopes(),
            priority: 1,
            getCodeActions: (editor, range, diagnostics) => {
                return this.getCodeActions(editor, range, diagnostics);
            },
        };
    }
    getCodeActions(editor, range, diagnostics) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = yield this._serverManager.getServer(editor);
            if (server == null || !code_action_adapter_1.default.canAdapt(server.capabilities)) {
                return null;
            }
            return code_action_adapter_1.default.getCodeActions(server.connection, server.capabilities, this.getServerAdapter(server, 'linterPushV2'), editor, range, diagnostics);
        });
    }
    consumeSignatureHelp(registry) {
        this._signatureHelpRegistry = registry;
        for (const server of this._serverManager.getActiveServers()) {
            const signatureHelpAdapter = this.getServerAdapter(server, 'signatureHelpAdapter');
            if (signatureHelpAdapter != null) {
                signatureHelpAdapter.attach(registry);
            }
        }
        return new atom_1.Disposable(() => {
            this._signatureHelpRegistry = undefined;
        });
    }
    consumeBusySignal(service) {
        this.busySignalService = service;
        return new atom_1.Disposable(() => delete this.busySignalService);
    }
    /**
     * `didChangeWatchedFiles` message filtering, override for custom logic.
     * @param filePath path of a file that has changed in the project path
     * @return false => message will not be sent to the language server
     */
    filterChangeWatchedFiles(filePath) {
        return true;
    }
    /**
     * Called on language server stderr output.
     * @param stderr a chunk of stderr from a language server instance
     */
    handleServerStderr(stderr, projectPath) {
        stderr.split('\n').filter((l) => l).forEach((line) => this.logger.warn(`stderr ${line}`));
    }
    getServerAdapter(server, adapter) {
        const adapters = this._serverAdapters.get(server);
        return adapters && adapters[adapter];
    }
}
exports.default = AutoLanguageClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1sYW5ndWFnZWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9hdXRvLWxhbmd1YWdlY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxvQ0FBb0M7QUFFcEMsc0NBQXNDO0FBQ3RDLDZCQUE2QjtBQUc3Qiw2Q0FBbUM7QUFDbkMsc0VBQTZEO0FBQzdELDBFQUFrRTtBQUNsRSx3RUFBK0Q7QUFDL0Qsd0VBQStEO0FBQy9ELDhFQUFxRTtBQUNyRSxnRUFBd0Q7QUFDeEQsc0VBQThEO0FBQzlELDRFQUFtRTtBQUNuRSxnRkFBdUU7QUFDdkUsOEVBQW9FO0FBQ3BFLGdGQUF1RTtBQUN2RSw0RUFBb0U7QUFDcEUsMEVBQWlFO0FBQ2pFLDhFQUFxRTtBQUNyRSxpQ0FBaUM7QUFFakMscURBQTREO0FBb0JyQyxtQ0FwQmQseUNBQXdCLENBb0JjO0FBbkIvQyxxQ0FJa0I7QUFDbEIsMkRBSTZCO0FBQzdCLCtCQU1jO0FBWWQsNkVBQTZFO0FBQzdFLHlFQUF5RTtBQUN6RSx1RUFBdUU7QUFDdkUsaUJBQWlCO0FBQ2pCLE1BQXFCLGtCQUFrQjtJQUF2QztRQU9VLG9CQUFlLEdBQVksS0FBSyxDQUFDO1FBQ2pDLG9CQUFlLEdBQUcsSUFBSSxPQUFPLEVBQWdDLENBQUM7UUFLNUQsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFzdEIzQixvQkFBZSxHQUEwQixDQUFPLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwRSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDMUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN6RDtpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDOUM7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVTLDJCQUFzQixHQUEwQixD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QkFBa0IsQ0FBQyxNQUFjLEVBQUUsV0FBbUI7UUFDOUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQUVPLGdCQUFnQixDQUN0QixNQUFvQixFQUFFLE9BQVU7UUFFaEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEQsT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7Q0FvQkY7QUFydkJELHFDQXF2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjcCBmcm9tICdjaGlsZF9wcm9jZXNzJztcclxuaW1wb3J0ICogYXMgbHMgZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XHJcbmltcG9ydCAqIGFzIHJwYyBmcm9tICd2c2NvZGUtanNvbnJwYyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xyXG5pbXBvcnQgKiBhcyBsaW50ZXIgZnJvbSAnYXRvbS9saW50ZXInO1xyXG5pbXBvcnQgQ29udmVydCBmcm9tICcuL2NvbnZlcnQuanMnO1xyXG5pbXBvcnQgQXBwbHlFZGl0QWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlcic7XHJcbmltcG9ydCBBdXRvY29tcGxldGVBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvYXV0b2NvbXBsZXRlLWFkYXB0ZXInO1xyXG5pbXBvcnQgQ29kZUFjdGlvbkFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9jb2RlLWFjdGlvbi1hZGFwdGVyJztcclxuaW1wb3J0IENvZGVGb3JtYXRBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvY29kZS1mb3JtYXQtYWRhcHRlcic7XHJcbmltcG9ydCBDb2RlSGlnaGxpZ2h0QWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2NvZGUtaGlnaGxpZ2h0LWFkYXB0ZXInO1xyXG5pbXBvcnQgRGF0YXRpcEFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9kYXRhdGlwLWFkYXB0ZXInO1xyXG5pbXBvcnQgRGVmaW5pdGlvbkFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9kZWZpbml0aW9uLWFkYXB0ZXInO1xyXG5pbXBvcnQgRG9jdW1lbnRTeW5jQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL2RvY3VtZW50LXN5bmMtYWRhcHRlcic7XHJcbmltcG9ydCBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9maW5kLXJlZmVyZW5jZXMtYWRhcHRlcic7XHJcbmltcG9ydCBMaW50ZXJQdXNoVjJBZGFwdGVyIGZyb20gJy4vYWRhcHRlcnMvbGludGVyLXB1c2gtdjItYWRhcHRlcic7XHJcbmltcG9ydCBMb2dnaW5nQ29uc29sZUFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9sb2dnaW5nLWNvbnNvbGUtYWRhcHRlcic7XHJcbmltcG9ydCBOb3RpZmljYXRpb25zQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL25vdGlmaWNhdGlvbnMtYWRhcHRlcic7XHJcbmltcG9ydCBPdXRsaW5lVmlld0FkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9vdXRsaW5lLXZpZXctYWRhcHRlcic7XHJcbmltcG9ydCBTaWduYXR1cmVIZWxwQWRhcHRlciBmcm9tICcuL2FkYXB0ZXJzL3NpZ25hdHVyZS1oZWxwLWFkYXB0ZXInO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL3V0aWxzJztcclxuaW1wb3J0IHsgU29ja2V0IH0gZnJvbSAnbmV0JztcclxuaW1wb3J0IHsgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIH0gZnJvbSAnLi9sYW5ndWFnZWNsaWVudCc7XHJcbmltcG9ydCB7XHJcbiAgQ29uc29sZUxvZ2dlcixcclxuICBGaWx0ZXJlZExvZ2dlcixcclxuICBMb2dnZXIsXHJcbn0gZnJvbSAnLi9sb2dnZXInO1xyXG5pbXBvcnQge1xyXG4gIExhbmd1YWdlU2VydmVyUHJvY2VzcyxcclxuICBTZXJ2ZXJNYW5hZ2VyLFxyXG4gIEFjdGl2ZVNlcnZlcixcclxufSBmcm9tICcuL3NlcnZlci1tYW5hZ2VyLmpzJztcclxuaW1wb3J0IHtcclxuICBEaXNwb3NhYmxlLFxyXG4gIENvbXBvc2l0ZURpc3Bvc2FibGUsXHJcbiAgUG9pbnQsXHJcbiAgUmFuZ2UsXHJcbiAgVGV4dEVkaXRvcixcclxufSBmcm9tICdhdG9tJztcclxuaW1wb3J0ICogYXMgYWMgZnJvbSAnYXRvbS9hdXRvY29tcGxldGUtcGx1cyc7XHJcblxyXG5leHBvcnQgeyBBY3RpdmVTZXJ2ZXIsIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiwgTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzIH07XHJcbmV4cG9ydCB0eXBlIENvbm5lY3Rpb25UeXBlID0gJ3N0ZGlvJyB8ICdzb2NrZXQnIHwgJ2lwYyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNlcnZlckFkYXB0ZXJzIHtcclxuICBsaW50ZXJQdXNoVjI6IExpbnRlclB1c2hWMkFkYXB0ZXI7XHJcbiAgbG9nZ2luZ0NvbnNvbGU6IExvZ2dpbmdDb25zb2xlQWRhcHRlcjtcclxuICBzaWduYXR1cmVIZWxwQWRhcHRlcj86IFNpZ25hdHVyZUhlbHBBZGFwdGVyO1xyXG59XHJcblxyXG4vLyBQdWJsaWM6IEF1dG9MYW5ndWFnZUNsaWVudCBwcm92aWRlcyBhIHNpbXBsZSB3YXkgdG8gaGF2ZSBhbGwgdGhlIHN1cHBvcnRlZFxyXG4vLyBBdG9tLUlERSBzZXJ2aWNlcyB3aXJlZCB1cCBlbnRpcmVseSBmb3IgeW91IGJ5IGp1c3Qgc3ViY2xhc3NpbmcgaXQgYW5kXHJcbi8vIGltcGxlbWVudGluZyBzdGFydFNlcnZlclByb2Nlc3MvZ2V0R3JhbW1hclNjb3Blcy9nZXRMYW5ndWFnZU5hbWUgYW5kXHJcbi8vIGdldFNlcnZlck5hbWUuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9MYW5ndWFnZUNsaWVudCB7XHJcbiAgcHJpdmF0ZSBfZGlzcG9zYWJsZSE6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgcHJpdmF0ZSBfc2VydmVyTWFuYWdlciE6IFNlcnZlck1hbmFnZXI7XHJcbiAgcHJpdmF0ZSBfY29uc29sZURlbGVnYXRlPzogYXRvbUlkZS5Db25zb2xlU2VydmljZTtcclxuICBwcml2YXRlIF9saW50ZXJEZWxlZ2F0ZT86IGxpbnRlci5JbmRpZURlbGVnYXRlO1xyXG4gIHByaXZhdGUgX3NpZ25hdHVyZUhlbHBSZWdpc3RyeT86IGF0b21JZGUuU2lnbmF0dXJlSGVscFJlZ2lzdHJ5O1xyXG4gIHByaXZhdGUgX2xhc3RBdXRvY29tcGxldGVSZXF1ZXN0PzogYWMuU3VnZ2VzdGlvbnNSZXF1ZXN0ZWRFdmVudDtcclxuICBwcml2YXRlIF9pc0RlYWN0aXZhdGluZzogYm9vbGVhbiA9IGZhbHNlO1xyXG4gIHByaXZhdGUgX3NlcnZlckFkYXB0ZXJzID0gbmV3IFdlYWtNYXA8QWN0aXZlU2VydmVyLCBTZXJ2ZXJBZGFwdGVycz4oKTtcclxuXHJcbiAgLy8gQXZhaWxhYmxlIGlmIGNvbnN1bWVCdXN5U2lnbmFsIGlzIHNldHVwXHJcbiAgcHJvdGVjdGVkIGJ1c3lTaWduYWxTZXJ2aWNlPzogYXRvbUlkZS5CdXN5U2lnbmFsU2VydmljZTtcclxuXHJcbiAgcHJvdGVjdGVkIHByb2Nlc3NTdGRFcnI6IHN0cmluZyA9ICcnO1xyXG4gIHByb3RlY3RlZCBsb2dnZXIhOiBMb2dnZXI7XHJcbiAgcHJvdGVjdGVkIG5hbWUhOiBzdHJpbmc7XHJcbiAgcHJvdGVjdGVkIHNvY2tldCE6IFNvY2tldDtcclxuXHJcbiAgLy8gU2hhcmVkIGFkYXB0ZXJzIHRoYXQgY2FuIHRha2UgdGhlIFJQQyBjb25uZWN0aW9uIGFzIHJlcXVpcmVkXHJcbiAgcHJvdGVjdGVkIGF1dG9Db21wbGV0ZT86IEF1dG9jb21wbGV0ZUFkYXB0ZXI7XHJcbiAgcHJvdGVjdGVkIGRhdGF0aXA/OiBEYXRhdGlwQWRhcHRlcjtcclxuICBwcm90ZWN0ZWQgZGVmaW5pdGlvbnM/OiBEZWZpbml0aW9uQWRhcHRlcjtcclxuICBwcm90ZWN0ZWQgZmluZFJlZmVyZW5jZXM/OiBGaW5kUmVmZXJlbmNlc0FkYXB0ZXI7XHJcbiAgcHJvdGVjdGVkIG91dGxpbmVWaWV3PzogT3V0bGluZVZpZXdBZGFwdGVyO1xyXG5cclxuICAvLyBZb3UgbXVzdCBpbXBsZW1lbnQgdGhlc2Ugc28gd2Uga25vdyBob3cgdG8gZGVhbCB3aXRoIHlvdXIgbGFuZ3VhZ2UgYW5kIHNlcnZlclxyXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgLy8gUmV0dXJuIGFuIGFycmF5IG9mIHRoZSBncmFtbWFyIHNjb3BlcyB5b3UgaGFuZGxlLCBlLmcuIFsgJ3NvdXJjZS5qcycgXVxyXG4gIHByb3RlY3RlZCBnZXRHcmFtbWFyU2NvcGVzKCk6IHN0cmluZ1tdIHtcclxuICAgIHRocm93IEVycm9yKCdNdXN0IGltcGxlbWVudCBnZXRHcmFtbWFyU2NvcGVzIHdoZW4gZXh0ZW5kaW5nIEF1dG9MYW5ndWFnZUNsaWVudCcpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBsYW5ndWFnZSB5b3Ugc3VwcG9ydCwgZS5nLiAnSmF2YVNjcmlwdCdcclxuICBwcm90ZWN0ZWQgZ2V0TGFuZ3VhZ2VOYW1lKCk6IHN0cmluZyB7XHJcbiAgICB0aHJvdyBFcnJvcignTXVzdCBpbXBsZW1lbnQgZ2V0TGFuZ3VhZ2VOYW1lIHdoZW4gZXh0ZW5kaW5nIEF1dG9MYW5ndWFnZUNsaWVudCcpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJuIHRoZSBuYW1lIG9mIHlvdXIgc2VydmVyLCBlLmcuICdFY2xpcHNlIEpEVCdcclxuICBwcm90ZWN0ZWQgZ2V0U2VydmVyTmFtZSgpOiBzdHJpbmcge1xyXG4gICAgdGhyb3cgRXJyb3IoJ011c3QgaW1wbGVtZW50IGdldFNlcnZlck5hbWUgd2hlbiBleHRlbmRpbmcgQXV0b0xhbmd1YWdlQ2xpZW50Jyk7XHJcbiAgfVxyXG5cclxuICAvLyBTdGFydCB5b3VyIHNlcnZlciBwcm9jZXNzXHJcbiAgcHJvdGVjdGVkIHN0YXJ0U2VydmVyUHJvY2Vzcyhwcm9qZWN0UGF0aDogc3RyaW5nKTogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzIHwgUHJvbWlzZTxMYW5ndWFnZVNlcnZlclByb2Nlc3M+IHtcclxuICAgIHRocm93IEVycm9yKCdNdXN0IG92ZXJyaWRlIHN0YXJ0U2VydmVyUHJvY2VzcyB0byBzdGFydCBsYW5ndWFnZSBzZXJ2ZXIgcHJvY2VzcyB3aGVuIGV4dGVuZGluZyBBdXRvTGFuZ3VhZ2VDbGllbnQnKTtcclxuICB9XHJcblxyXG4gIC8vIFlvdSBtaWdodCB3YW50IHRvIG92ZXJyaWRlIHRoZXNlIGZvciBkaWZmZXJlbnQgYmVoYXZpb3JcclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgd2Ugc2hvdWxkIHN0YXJ0IGEgc2VydmVyIGZvciBhIGdpdmVuIGVkaXRvciBpZiB3ZSBkb24ndCBoYXZlIG9uZSB5ZXRcclxuICBwcm90ZWN0ZWQgc2hvdWxkU3RhcnRGb3JFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCkuaW5jbHVkZXMoZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJuIHRoZSBwYXJhbWV0ZXJzIHVzZWQgdG8gaW5pdGlhbGl6ZSBhIGNsaWVudCAtIHlvdSBtYXkgd2FudCB0byBleHRlbmQgY2FwYWJpbGl0aWVzXHJcbiAgcHJvdGVjdGVkIGdldEluaXRpYWxpemVQYXJhbXMocHJvamVjdFBhdGg6IHN0cmluZywgcHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzKTogbHMuSW5pdGlhbGl6ZVBhcmFtcyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBwcm9jZXNzSWQ6IHByb2Nlc3MucGlkLFxyXG4gICAgICByb290UGF0aDogcHJvamVjdFBhdGgsXHJcbiAgICAgIHJvb3RVcmk6IENvbnZlcnQucGF0aFRvVXJpKHByb2plY3RQYXRoKSxcclxuICAgICAgd29ya3NwYWNlRm9sZGVyczogW10sXHJcbiAgICAgIGNhcGFiaWxpdGllczoge1xyXG4gICAgICAgIHdvcmtzcGFjZToge1xyXG4gICAgICAgICAgYXBwbHlFZGl0OiB0cnVlLFxyXG4gICAgICAgICAgY29uZmlndXJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICB3b3Jrc3BhY2VFZGl0OiB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50Q2hhbmdlczogdHJ1ZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB3b3Jrc3BhY2VGb2xkZXJzOiBmYWxzZSxcclxuICAgICAgICAgIGRpZENoYW5nZUNvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzOiB7XHJcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHN5bWJvbDoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGVjdXRlQ29tbWFuZDoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZXh0RG9jdW1lbnQ6IHtcclxuICAgICAgICAgIHN5bmNocm9uaXphdGlvbjoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgd2lsbFNhdmU6IHRydWUsXHJcbiAgICAgICAgICAgIHdpbGxTYXZlV2FpdFVudGlsOiB0cnVlLFxyXG4gICAgICAgICAgICBkaWRTYXZlOiB0cnVlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGNvbXBsZXRpb246IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgIGNvbXBsZXRpb25JdGVtOiB7XHJcbiAgICAgICAgICAgICAgc25pcHBldFN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgY29tbWl0Q2hhcmFjdGVyc1N1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb250ZXh0U3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBob3Zlcjoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzaWduYXR1cmVIZWxwOiB7XHJcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHJlZmVyZW5jZXM6IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZG9jdW1lbnRIaWdobGlnaHQ6IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZG9jdW1lbnRTeW1ib2w6IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICAgIGhpZXJhcmNoaWNhbERvY3VtZW50U3ltYm9sU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBmb3JtYXR0aW5nOiB7XHJcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHJhbmdlRm9ybWF0dGluZzoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBvblR5cGVGb3JtYXR0aW5nOiB7XHJcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgY29kZUFjdGlvbjoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBjb2RlTGVuczoge1xyXG4gICAgICAgICAgICBkeW5hbWljUmVnaXN0cmF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBkb2N1bWVudExpbms6IHtcclxuICAgICAgICAgICAgZHluYW1pY1JlZ2lzdHJhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgcmVuYW1lOiB7XHJcbiAgICAgICAgICAgIGR5bmFtaWNSZWdpc3RyYXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAvLyBXZSBkbyBub3Qgc3VwcG9ydCB0aGVzZSBmZWF0dXJlcyB5ZXQuXHJcbiAgICAgICAgICAvLyBOZWVkIHRvIHNldCB0byB1bmRlZmluZWQgdG8gYXBwZWFzZSBUeXBlU2NyaXB0IHdlYWsgdHlwZSBkZXRlY3Rpb24uXHJcbiAgICAgICAgICBpbXBsZW1lbnRhdGlvbjogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgdHlwZURlZmluaXRpb246IHVuZGVmaW5lZCxcclxuICAgICAgICAgIGNvbG9yUHJvdmlkZXI6IHVuZGVmaW5lZCxcclxuICAgICAgICAgIGZvbGRpbmdSYW5nZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXhwZXJpbWVudGFsOiB7fSxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBFYXJseSB3aXJlLXVwIG9mIGxpc3RlbmVycyBiZWZvcmUgaW5pdGlhbGl6ZSBtZXRob2QgaXMgc2VudFxyXG4gIHByb3RlY3RlZCBwcmVJbml0aWFsaXphdGlvbihjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24pOiB2b2lkIHt9XHJcblxyXG4gIC8vIExhdGUgd2lyZS11cCBvZiBsaXN0ZW5lcnMgYWZ0ZXIgaW5pdGlhbGl6ZSBtZXRob2QgaGFzIGJlZW4gc2VudFxyXG4gIHByb3RlY3RlZCBwb3N0SW5pdGlhbGl6YXRpb24oc2VydmVyOiBBY3RpdmVTZXJ2ZXIpOiB2b2lkIHt9XHJcblxyXG4gIC8vIERldGVybWluZSB3aGV0aGVyIHRvIHVzZSBpcGMsIHN0ZGlvIG9yIHNvY2tldCB0byBjb25uZWN0IHRvIHRoZSBzZXJ2ZXJcclxuICBwcm90ZWN0ZWQgZ2V0Q29ubmVjdGlvblR5cGUoKTogQ29ubmVjdGlvblR5cGUge1xyXG4gICAgcmV0dXJuIHRoaXMuc29ja2V0ICE9IG51bGwgPyAnc29ja2V0JyA6ICdzdGRpbyc7XHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm4gdGhlIG5hbWUgb2YgeW91ciByb290IGNvbmZpZ3VyYXRpb24ga2V5XHJcbiAgcHJvdGVjdGVkIGdldFJvb3RDb25maWd1cmF0aW9uS2V5KCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gJyc7XHJcbiAgfVxyXG5cclxuICAvLyBPcHRpb25hbGx5IHRyYW5zZm9ybSB0aGUgY29uZmlndXJhdGlvbiBvYmplY3QgYmVmb3JlIGl0IGlzIHNlbnQgdG8gdGhlIHNlcnZlclxyXG4gIHByb3RlY3RlZCBtYXBDb25maWd1cmF0aW9uT2JqZWN0KGNvbmZpZ3VyYXRpb246IGFueSk6IGFueSB7XHJcbiAgICByZXR1cm4gY29uZmlndXJhdGlvbjtcclxuICB9XHJcblxyXG4gIC8vIEhlbHBlciBtZXRob2RzIHRoYXQgYXJlIHVzZWZ1bCBmb3IgaW1wbGVtZW50b3JzXHJcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG4gIC8vIEdldHMgYSBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24gZm9yIGEgZ2l2ZW4gVGV4dEVkaXRvclxyXG4gIHByb3RlY3RlZCBhc3luYyBnZXRDb25uZWN0aW9uRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIHwgbnVsbD4ge1xyXG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcclxuICAgIHJldHVybiBzZXJ2ZXIgPyBzZXJ2ZXIuY29ubmVjdGlvbiA6IG51bGw7XHJcbiAgfVxyXG5cclxuICAvLyBSZXN0YXJ0IGFsbCBhY3RpdmUgbGFuZ3VhZ2Ugc2VydmVycyBmb3IgdGhpcyBsYW5ndWFnZSBjbGllbnQgaW4gdGhlIHdvcmtzcGFjZVxyXG4gIHByb3RlY3RlZCBhc3luYyByZXN0YXJ0QWxsU2VydmVycygpIHtcclxuICAgIGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIucmVzdGFydEFsbFNlcnZlcnMoKTtcclxuICB9XHJcblxyXG4gIC8vIERlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgdGhlIHJlc3Qgb2YgdGhlIEF1dG9MYW5ndWFnZUNsaWVudFxyXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICAvLyBBY3RpdmF0ZSBkb2VzIHZlcnkgbGl0dGxlIGZvciBwZXJmIHJlYXNvbnMgLSBob29rcyBpbiB2aWEgU2VydmVyTWFuYWdlciBmb3IgbGF0ZXIgJ2FjdGl2YXRpb24nXHJcbiAgcHVibGljIGFjdGl2YXRlKCk6IHZvaWQge1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICB0aGlzLm5hbWUgPSBgJHt0aGlzLmdldExhbmd1YWdlTmFtZSgpfSAoJHt0aGlzLmdldFNlcnZlck5hbWUoKX0pYDtcclxuICAgIHRoaXMubG9nZ2VyID0gdGhpcy5nZXRMb2dnZXIoKTtcclxuICAgIHRoaXMuX3NlcnZlck1hbmFnZXIgPSBuZXcgU2VydmVyTWFuYWdlcihcclxuICAgICAgKHApID0+IHRoaXMuc3RhcnRTZXJ2ZXIocCksXHJcbiAgICAgIHRoaXMubG9nZ2VyLFxyXG4gICAgICAoZSkgPT4gdGhpcy5zaG91bGRTdGFydEZvckVkaXRvcihlKSxcclxuICAgICAgKGZpbGVwYXRoKSA9PiB0aGlzLmZpbHRlckNoYW5nZVdhdGNoZWRGaWxlcyhmaWxlcGF0aCksXHJcbiAgICAgIHRoaXMucmVwb3J0QnVzeVdoaWxlLFxyXG4gICAgICB0aGlzLmdldFNlcnZlck5hbWUoKSxcclxuICAgICk7XHJcbiAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnN0YXJ0TGlzdGVuaW5nKCk7XHJcbiAgICBwcm9jZXNzLm9uKCdleGl0JywgKCkgPT4gdGhpcy5leGl0Q2xlYW51cC5iaW5kKHRoaXMpKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZXhpdENsZWFudXAoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnRlcm1pbmF0ZSgpO1xyXG4gIH1cclxuXHJcbiAgLy8gRGVhY3RpdmF0ZSBkaXNwb3NlcyB0aGUgcmVzb3VyY2VzIHdlJ3JlIHVzaW5nXHJcbiAgcHVibGljIGFzeW5jIGRlYWN0aXZhdGUoKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHRoaXMuX2lzRGVhY3RpdmF0aW5nID0gdHJ1ZTtcclxuICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgdGhpcy5fc2VydmVyTWFuYWdlci5zdG9wTGlzdGVuaW5nKCk7XHJcbiAgICBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnN0b3BBbGxTZXJ2ZXJzKCk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3Bhd25DaGlsZE5vZGUoYXJnczogc3RyaW5nW10sIG9wdGlvbnM6IGNwLlNwYXduT3B0aW9ucyA9IHt9KTogY3AuQ2hpbGRQcm9jZXNzIHtcclxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKGBzdGFydGluZyBjaGlsZCBOb2RlIFwiJHthcmdzLmpvaW4oJyAnKX1cImApO1xyXG4gICAgb3B0aW9ucy5lbnYgPSBvcHRpb25zLmVudiB8fCBPYmplY3QuY3JlYXRlKHByb2Nlc3MuZW52KTtcclxuICAgIGlmIChvcHRpb25zLmVudikge1xyXG4gICAgICBvcHRpb25zLmVudi5FTEVDVFJPTl9SVU5fQVNfTk9ERSA9ICcxJztcclxuICAgICAgb3B0aW9ucy5lbnYuRUxFQ1RST05fTk9fQVRUQUNIX0NPTlNPTEUgPSAnMSc7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY3Auc3Bhd24ocHJvY2Vzcy5leGVjUGF0aCwgYXJncywgb3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvLyBMU1AgbG9nZ2luZyBpcyBvbmx5IHNldCBmb3Igd2FybmluZ3MgJiBlcnJvcnMgYnkgZGVmYXVsdCB1bmxlc3MgeW91IHR1cm4gb24gdGhlIGNvcmUuZGVidWdMU1Agc2V0dGluZ1xyXG4gIHByb3RlY3RlZCBnZXRMb2dnZXIoKTogTG9nZ2VyIHtcclxuICAgIGNvbnN0IGZpbHRlciA9IGF0b20uY29uZmlnLmdldCgnY29yZS5kZWJ1Z0xTUCcpXHJcbiAgICAgID8gRmlsdGVyZWRMb2dnZXIuRGV2ZWxvcGVyTGV2ZWxGaWx0ZXJcclxuICAgICAgOiBGaWx0ZXJlZExvZ2dlci5Vc2VyTGV2ZWxGaWx0ZXI7XHJcbiAgICByZXR1cm4gbmV3IEZpbHRlcmVkTG9nZ2VyKG5ldyBDb25zb2xlTG9nZ2VyKHRoaXMubmFtZSksIGZpbHRlcik7XHJcbiAgfVxyXG5cclxuICAvLyBTdGFydHMgdGhlIHNlcnZlciBieSBzdGFydGluZyB0aGUgcHJvY2VzcywgdGhlbiBpbml0aWFsaXppbmcgdGhlIGxhbmd1YWdlIHNlcnZlciBhbmQgc3RhcnRpbmcgYWRhcHRlcnNcclxuICBwcml2YXRlIGFzeW5jIHN0YXJ0U2VydmVyKHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEFjdGl2ZVNlcnZlcj4ge1xyXG4gICAgY29uc3QgcHJvY2VzcyA9IGF3YWl0IHRoaXMucmVwb3J0QnVzeVdoaWxlKFxyXG4gICAgICBgU3RhcnRpbmcgJHt0aGlzLmdldFNlcnZlck5hbWUoKX0gZm9yICR7cGF0aC5iYXNlbmFtZShwcm9qZWN0UGF0aCl9YCxcclxuICAgICAgYXN5bmMgKCkgPT4gdGhpcy5zdGFydFNlcnZlclByb2Nlc3MocHJvamVjdFBhdGgpLFxyXG4gICAgKTtcclxuICAgIHRoaXMuY2FwdHVyZVNlcnZlckVycm9ycyhwcm9jZXNzLCBwcm9qZWN0UGF0aCk7XHJcbiAgICBjb25zdCBjb25uZWN0aW9uID0gbmV3IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbih0aGlzLmNyZWF0ZVJwY0Nvbm5lY3Rpb24ocHJvY2VzcyksIHRoaXMubG9nZ2VyKTtcclxuICAgIHRoaXMucHJlSW5pdGlhbGl6YXRpb24oY29ubmVjdGlvbik7XHJcbiAgICBjb25zdCBpbml0aWFsaXplUGFyYW1zID0gdGhpcy5nZXRJbml0aWFsaXplUGFyYW1zKHByb2plY3RQYXRoLCBwcm9jZXNzKTtcclxuICAgIGNvbnN0IGluaXRpYWxpemF0aW9uID0gY29ubmVjdGlvbi5pbml0aWFsaXplKGluaXRpYWxpemVQYXJhbXMpO1xyXG4gICAgdGhpcy5yZXBvcnRCdXN5V2hpbGUoXHJcbiAgICAgIGAke3RoaXMuZ2V0U2VydmVyTmFtZSgpfSBpbml0aWFsaXppbmcgZm9yICR7cGF0aC5iYXNlbmFtZShwcm9qZWN0UGF0aCl9YCxcclxuICAgICAgKCkgPT4gaW5pdGlhbGl6YXRpb24sXHJcbiAgICApO1xyXG4gICAgY29uc3QgaW5pdGlhbGl6ZVJlc3BvbnNlID0gYXdhaXQgaW5pdGlhbGl6YXRpb247XHJcbiAgICBjb25zdCBuZXdTZXJ2ZXIgPSB7XHJcbiAgICAgIHByb2plY3RQYXRoLFxyXG4gICAgICBwcm9jZXNzLFxyXG4gICAgICBjb25uZWN0aW9uLFxyXG4gICAgICBjYXBhYmlsaXRpZXM6IGluaXRpYWxpemVSZXNwb25zZS5jYXBhYmlsaXRpZXMsXHJcbiAgICAgIGRpc3Bvc2FibGU6IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCksXHJcbiAgICB9O1xyXG4gICAgdGhpcy5wb3N0SW5pdGlhbGl6YXRpb24obmV3U2VydmVyKTtcclxuICAgIGNvbm5lY3Rpb24uaW5pdGlhbGl6ZWQoKTtcclxuICAgIGNvbm5lY3Rpb24ub24oJ2Nsb3NlJywgKCkgPT4ge1xyXG4gICAgICBpZiAoIXRoaXMuX2lzRGVhY3RpdmF0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5fc2VydmVyTWFuYWdlci5zdG9wU2VydmVyKG5ld1NlcnZlcik7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmhhc1NlcnZlclJlYWNoZWRSZXN0YXJ0TGltaXQobmV3U2VydmVyKSkge1xyXG4gICAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFJlc3RhcnRpbmcgbGFuZ3VhZ2Ugc2VydmVyIGZvciBwcm9qZWN0ICcke25ld1NlcnZlci5wcm9qZWN0UGF0aH0nYCk7XHJcbiAgICAgICAgICB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLnN0YXJ0U2VydmVyKHByb2plY3RQYXRoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5sb2dnZXIud2FybihgTGFuZ3VhZ2Ugc2VydmVyIGhhcyBleGNlZWRlZCBhdXRvLXJlc3RhcnQgbGltaXQgZm9yIHByb2plY3QgJyR7bmV3U2VydmVyLnByb2plY3RQYXRofSdgKTtcclxuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcclxuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxyXG4gICAgICAgICAgICBgVGhlICR7dGhpcy5uYW1lfSBsYW5ndWFnZSBzZXJ2ZXIgaGFzIGV4aXRlZCBhbmQgZXhjZWVkZWQgdGhlIHJlc3RhcnQgbGltaXQgZm9yIHByb2plY3QgJyR7bmV3U2VydmVyLnByb2plY3RQYXRofSdgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGNvbmZpZ3VyYXRpb25LZXkgPSB0aGlzLmdldFJvb3RDb25maWd1cmF0aW9uS2V5KCk7XHJcbiAgICBpZiAoY29uZmlndXJhdGlvbktleSkge1xyXG4gICAgICBuZXdTZXJ2ZXIuZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWd1cmF0aW9uS2V5LCAoY29uZmlnKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBtYXBwZWRDb25maWcgPSB0aGlzLm1hcENvbmZpZ3VyYXRpb25PYmplY3QoY29uZmlnIHx8IHt9KTtcclxuICAgICAgICAgIGlmIChtYXBwZWRDb25maWcpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvbi5kaWRDaGFuZ2VDb25maWd1cmF0aW9uKHtcclxuICAgICAgICAgICAgICBzZXR0aW5nczogbWFwcGVkQ29uZmlnLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdGFydEV4Y2x1c2l2ZUFkYXB0ZXJzKG5ld1NlcnZlcik7XHJcbiAgICByZXR1cm4gbmV3U2VydmVyO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjYXB0dXJlU2VydmVyRXJyb3JzKGNoaWxkUHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzLCBwcm9qZWN0UGF0aDogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjaGlsZFByb2Nlc3Mub24oJ2Vycm9yJywgKGVycikgPT4gdGhpcy5oYW5kbGVTcGF3bkZhaWx1cmUoZXJyKSk7XHJcbiAgICBjaGlsZFByb2Nlc3Mub24oJ2V4aXQnLCAoY29kZSwgc2lnbmFsKSA9PiB0aGlzLmxvZ2dlci5kZWJ1ZyhgZXhpdDogY29kZSAke2NvZGV9IHNpZ25hbCAke3NpZ25hbH1gKSk7XHJcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XHJcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgKGNodW5rOiBCdWZmZXIpID0+IHtcclxuICAgICAgY29uc3QgZXJyb3JTdHJpbmcgPSBjaHVuay50b1N0cmluZygpO1xyXG4gICAgICB0aGlzLmhhbmRsZVNlcnZlclN0ZGVycihlcnJvclN0cmluZywgcHJvamVjdFBhdGgpO1xyXG4gICAgICAvLyBLZWVwIHRoZSBsYXN0IDUgbGluZXMgZm9yIHBhY2thZ2VzIHRvIHVzZSBpbiBtZXNzYWdlc1xyXG4gICAgICB0aGlzLnByb2Nlc3NTdGRFcnIgPSAodGhpcy5wcm9jZXNzU3RkRXJyICsgZXJyb3JTdHJpbmcpXHJcbiAgICAgICAgLnNwbGl0KCdcXG4nKVxyXG4gICAgICAgIC5zbGljZSgtNSlcclxuICAgICAgICAuam9pbignXFxuJyk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFuZGxlU3Bhd25GYWlsdXJlKGVycjogYW55KTogdm9pZCB7XHJcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXHJcbiAgICAgIGAke3RoaXMuZ2V0U2VydmVyTmFtZSgpfSBsYW5ndWFnZSBzZXJ2ZXIgZm9yICR7dGhpcy5nZXRMYW5ndWFnZU5hbWUoKX0gdW5hYmxlIHRvIHN0YXJ0YCxcclxuICAgICAge1xyXG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiBlcnIudG9TdHJpbmcoKSxcclxuICAgICAgfSxcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvLyBDcmVhdGVzIHRoZSBSUEMgY29ubmVjdGlvbiB3aGljaCBjYW4gYmUgaXBjLCBzb2NrZXQgb3Igc3RkaW9cclxuICBwcml2YXRlIGNyZWF0ZVJwY0Nvbm5lY3Rpb24ocHJvY2VzczogTGFuZ3VhZ2VTZXJ2ZXJQcm9jZXNzKTogcnBjLk1lc3NhZ2VDb25uZWN0aW9uIHtcclxuICAgIGxldCByZWFkZXI6IHJwYy5NZXNzYWdlUmVhZGVyO1xyXG4gICAgbGV0IHdyaXRlcjogcnBjLk1lc3NhZ2VXcml0ZXI7XHJcbiAgICBjb25zdCBjb25uZWN0aW9uVHlwZSA9IHRoaXMuZ2V0Q29ubmVjdGlvblR5cGUoKTtcclxuICAgIHN3aXRjaCAoY29ubmVjdGlvblR5cGUpIHtcclxuICAgICAgY2FzZSAnaXBjJzpcclxuICAgICAgICByZWFkZXIgPSBuZXcgcnBjLklQQ01lc3NhZ2VSZWFkZXIocHJvY2VzcyBhcyBjcC5DaGlsZFByb2Nlc3MpO1xyXG4gICAgICAgIHdyaXRlciA9IG5ldyBycGMuSVBDTWVzc2FnZVdyaXRlcihwcm9jZXNzIGFzIGNwLkNoaWxkUHJvY2Vzcyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3NvY2tldCc6XHJcbiAgICAgICAgcmVhZGVyID0gbmV3IHJwYy5Tb2NrZXRNZXNzYWdlUmVhZGVyKHRoaXMuc29ja2V0KTtcclxuICAgICAgICB3cml0ZXIgPSBuZXcgcnBjLlNvY2tldE1lc3NhZ2VXcml0ZXIodGhpcy5zb2NrZXQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdzdGRpbyc6XHJcbiAgICAgICAgcmVhZGVyID0gbmV3IHJwYy5TdHJlYW1NZXNzYWdlUmVhZGVyKHByb2Nlc3Muc3Rkb3V0KTtcclxuICAgICAgICB3cml0ZXIgPSBuZXcgcnBjLlN0cmVhbU1lc3NhZ2VXcml0ZXIocHJvY2Vzcy5zdGRpbik7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIFV0aWxzLmFzc2VydFVucmVhY2hhYmxlKGNvbm5lY3Rpb25UeXBlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcnBjLmNyZWF0ZU1lc3NhZ2VDb25uZWN0aW9uKHJlYWRlciwgd3JpdGVyLCB7XHJcbiAgICAgIGxvZzogKC4uLmFyZ3M6IGFueVtdKSA9PiB7fSxcclxuICAgICAgd2FybjogKC4uLmFyZ3M6IGFueVtdKSA9PiB7fSxcclxuICAgICAgaW5mbzogKC4uLmFyZ3M6IGFueVtdKSA9PiB7fSxcclxuICAgICAgZXJyb3I6ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGFyZ3MpO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvLyBTdGFydCBhZGFwdGVycyB0aGF0IGFyZSBub3Qgc2hhcmVkIGJldHdlZW4gc2VydmVyc1xyXG4gIHByaXZhdGUgc3RhcnRFeGNsdXNpdmVBZGFwdGVycyhzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IHZvaWQge1xyXG4gICAgQXBwbHlFZGl0QWRhcHRlci5hdHRhY2goc2VydmVyLmNvbm5lY3Rpb24pO1xyXG4gICAgTm90aWZpY2F0aW9uc0FkYXB0ZXIuYXR0YWNoKHNlcnZlci5jb25uZWN0aW9uLCB0aGlzLm5hbWUsIHNlcnZlci5wcm9qZWN0UGF0aCk7XHJcblxyXG4gICAgaWYgKERvY3VtZW50U3luY0FkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcclxuICAgICAgY29uc3QgZG9jU3luY0FkYXB0ZXIgPVxyXG4gICAgICAgIG5ldyBEb2N1bWVudFN5bmNBZGFwdGVyKFxyXG4gICAgICAgICAgc2VydmVyLmNvbm5lY3Rpb24sXHJcbiAgICAgICAgICAoZWRpdG9yKSA9PiB0aGlzLnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCBzZXJ2ZXIucHJvamVjdFBhdGgpLFxyXG4gICAgICAgICAgc2VydmVyLmNhcGFiaWxpdGllcy50ZXh0RG9jdW1lbnRTeW5jLFxyXG4gICAgICAgICAgdGhpcy5yZXBvcnRCdXN5V2hpbGUsXHJcbiAgICAgICAgKTtcclxuICAgICAgc2VydmVyLmRpc3Bvc2FibGUuYWRkKGRvY1N5bmNBZGFwdGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsaW50ZXJQdXNoVjIgPSBuZXcgTGludGVyUHVzaFYyQWRhcHRlcihzZXJ2ZXIuY29ubmVjdGlvbik7XHJcbiAgICBpZiAodGhpcy5fbGludGVyRGVsZWdhdGUgIT0gbnVsbCkge1xyXG4gICAgICBsaW50ZXJQdXNoVjIuYXR0YWNoKHRoaXMuX2xpbnRlckRlbGVnYXRlKTtcclxuICAgIH1cclxuICAgIHNlcnZlci5kaXNwb3NhYmxlLmFkZChsaW50ZXJQdXNoVjIpO1xyXG5cclxuICAgIGNvbnN0IGxvZ2dpbmdDb25zb2xlID0gbmV3IExvZ2dpbmdDb25zb2xlQWRhcHRlcihzZXJ2ZXIuY29ubmVjdGlvbik7XHJcbiAgICBpZiAodGhpcy5fY29uc29sZURlbGVnYXRlICE9IG51bGwpIHtcclxuICAgICAgbG9nZ2luZ0NvbnNvbGUuYXR0YWNoKHRoaXMuX2NvbnNvbGVEZWxlZ2F0ZSh7IGlkOiB0aGlzLm5hbWUsIG5hbWU6ICdhYmMnIH0pKTtcclxuICAgIH1cclxuICAgIHNlcnZlci5kaXNwb3NhYmxlLmFkZChsb2dnaW5nQ29uc29sZSk7XHJcblxyXG4gICAgbGV0IHNpZ25hdHVyZUhlbHBBZGFwdGVyOiBTaWduYXR1cmVIZWxwQWRhcHRlciB8IHVuZGVmaW5lZDtcclxuICAgIGlmIChTaWduYXR1cmVIZWxwQWRhcHRlci5jYW5BZGFwdChzZXJ2ZXIuY2FwYWJpbGl0aWVzKSkge1xyXG4gICAgICBzaWduYXR1cmVIZWxwQWRhcHRlciA9IG5ldyBTaWduYXR1cmVIZWxwQWRhcHRlcihzZXJ2ZXIsIHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpKTtcclxuICAgICAgaWYgKHRoaXMuX3NpZ25hdHVyZUhlbHBSZWdpc3RyeSAhPSBudWxsKSB7XHJcbiAgICAgICAgc2lnbmF0dXJlSGVscEFkYXB0ZXIuYXR0YWNoKHRoaXMuX3NpZ25hdHVyZUhlbHBSZWdpc3RyeSk7XHJcbiAgICAgIH1cclxuICAgICAgc2VydmVyLmRpc3Bvc2FibGUuYWRkKHNpZ25hdHVyZUhlbHBBZGFwdGVyKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9zZXJ2ZXJBZGFwdGVycy5zZXQoc2VydmVyLCB7XHJcbiAgICAgIGxpbnRlclB1c2hWMiwgbG9nZ2luZ0NvbnNvbGUsIHNpZ25hdHVyZUhlbHBBZGFwdGVyLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2hvdWxkU3luY0ZvckVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHByb2plY3RQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmlzRmlsZUluUHJvamVjdChlZGl0b3IsIHByb2plY3RQYXRoKSAmJiB0aGlzLnNob3VsZFN0YXJ0Rm9yRWRpdG9yKGVkaXRvcik7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgaXNGaWxlSW5Qcm9qZWN0KGVkaXRvcjogVGV4dEVkaXRvciwgcHJvamVjdFBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIChlZGl0b3IuZ2V0UGF0aCgpIHx8ICcnKS5zdGFydHNXaXRoKHByb2plY3RQYXRoKTtcclxuICB9XHJcblxyXG4gIC8vIEF1dG9jb21wbGV0ZSsgdmlhIExTIGNvbXBsZXRpb24tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICBwdWJsaWMgcHJvdmlkZUF1dG9jb21wbGV0ZSgpOiBhYy5BdXRvY29tcGxldGVQcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzZWxlY3RvcjogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKClcclxuICAgICAgICAubWFwKChnKSA9PiBnLmluY2x1ZGVzKCcuJykgPyAnLicgKyBnIDogZylcclxuICAgICAgICAuam9pbignLCAnKSxcclxuICAgICAgaW5jbHVzaW9uUHJpb3JpdHk6IDEsXHJcbiAgICAgIHN1Z2dlc3Rpb25Qcmlvcml0eTogMixcclxuICAgICAgZXhjbHVkZUxvd2VyUHJpb3JpdHk6IGZhbHNlLFxyXG4gICAgICBnZXRTdWdnZXN0aW9uczogdGhpcy5nZXRTdWdnZXN0aW9ucy5iaW5kKHRoaXMpLFxyXG4gICAgICBvbkRpZEluc2VydFN1Z2dlc3Rpb246IHRoaXMub25EaWRJbnNlcnRTdWdnZXN0aW9uLmJpbmQodGhpcyksXHJcbiAgICAgIGdldFN1Z2dlc3Rpb25EZXRhaWxzT25TZWxlY3Q6IHRoaXMuZ2V0U3VnZ2VzdGlvbkRldGFpbHNPblNlbGVjdC5iaW5kKHRoaXMpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3luYyBnZXRTdWdnZXN0aW9ucyhcclxuICAgIHJlcXVlc3Q6IGFjLlN1Z2dlc3Rpb25zUmVxdWVzdGVkRXZlbnQsXHJcbiAgKTogUHJvbWlzZTxhYy5BbnlTdWdnZXN0aW9uW10+IHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKHJlcXVlc3QuZWRpdG9yKTtcclxuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhQXV0b2NvbXBsZXRlQWRhcHRlci5jYW5BZGFwdChzZXJ2ZXIuY2FwYWJpbGl0aWVzKSkge1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hdXRvQ29tcGxldGUgPSB0aGlzLmF1dG9Db21wbGV0ZSB8fCBuZXcgQXV0b2NvbXBsZXRlQWRhcHRlcigpO1xyXG4gICAgdGhpcy5fbGFzdEF1dG9jb21wbGV0ZVJlcXVlc3QgPSByZXF1ZXN0O1xyXG4gICAgcmV0dXJuIHRoaXMuYXV0b0NvbXBsZXRlLmdldFN1Z2dlc3Rpb25zKHNlcnZlciwgcmVxdWVzdCwgdGhpcy5vbkRpZENvbnZlcnRBdXRvY29tcGxldGUsXHJcbiAgICAgIGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMubWluaW11bVdvcmRMZW5ndGgnKSk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0U3VnZ2VzdGlvbkRldGFpbHNPblNlbGVjdChcclxuICAgIHN1Z2dlc3Rpb246IGFjLkFueVN1Z2dlc3Rpb24sXHJcbiAgKTogUHJvbWlzZTxhYy5BbnlTdWdnZXN0aW9uIHwgbnVsbD4ge1xyXG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuX2xhc3RBdXRvY29tcGxldGVSZXF1ZXN0O1xyXG4gICAgaWYgKHJlcXVlc3QgPT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxyXG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIocmVxdWVzdC5lZGl0b3IpO1xyXG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFBdXRvY29tcGxldGVBZGFwdGVyLmNhblJlc29sdmUoc2VydmVyLmNhcGFiaWxpdGllcykgfHwgdGhpcy5hdXRvQ29tcGxldGUgPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5hdXRvQ29tcGxldGUuY29tcGxldGVTdWdnZXN0aW9uKHNlcnZlciwgc3VnZ2VzdGlvbiwgcmVxdWVzdCwgdGhpcy5vbkRpZENvbnZlcnRBdXRvY29tcGxldGUpO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIG9uRGlkQ29udmVydEF1dG9jb21wbGV0ZShcclxuICAgIGNvbXBsZXRpb25JdGVtOiBscy5Db21wbGV0aW9uSXRlbSxcclxuICAgIHN1Z2dlc3Rpb246IGFjLkFueVN1Z2dlc3Rpb24sXHJcbiAgICByZXF1ZXN0OiBhYy5TdWdnZXN0aW9uc1JlcXVlc3RlZEV2ZW50LFxyXG4gICk6IHZvaWQge1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIG9uRGlkSW5zZXJ0U3VnZ2VzdGlvbihhcmc6IGFjLlN1Z2dlc3Rpb25JbnNlcnRlZEV2ZW50KTogdm9pZCB7fVxyXG5cclxuICAvLyBEZWZpbml0aW9ucyB2aWEgTFMgZG9jdW1lbnRIaWdobGlnaHQgYW5kIGdvdG9EZWZpbml0aW9uLS0tLS0tLS0tLS0tXHJcbiAgcHVibGljIHByb3ZpZGVEZWZpbml0aW9ucygpOiBhdG9tSWRlLkRlZmluaXRpb25Qcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBuYW1lOiB0aGlzLm5hbWUsXHJcbiAgICAgIHByaW9yaXR5OiAyMCxcclxuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXHJcbiAgICAgIGdldERlZmluaXRpb246IHRoaXMuZ2V0RGVmaW5pdGlvbi5iaW5kKHRoaXMpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3luYyBnZXREZWZpbml0aW9uKGVkaXRvcjogVGV4dEVkaXRvciwgcG9pbnQ6IFBvaW50KTogUHJvbWlzZTxhdG9tSWRlLkRlZmluaXRpb25RdWVyeVJlc3VsdCB8IG51bGw+IHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XHJcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIURlZmluaXRpb25BZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGVmaW5pdGlvbnMgPSB0aGlzLmRlZmluaXRpb25zIHx8IG5ldyBEZWZpbml0aW9uQWRhcHRlcigpO1xyXG4gICAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbnMuZ2V0RGVmaW5pdGlvbihcclxuICAgICAgc2VydmVyLmNvbm5lY3Rpb24sXHJcbiAgICAgIHNlcnZlci5jYXBhYmlsaXRpZXMsXHJcbiAgICAgIHRoaXMuZ2V0TGFuZ3VhZ2VOYW1lKCksXHJcbiAgICAgIGVkaXRvcixcclxuICAgICAgcG9pbnQsXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgLy8gT3V0bGluZSBWaWV3IHZpYSBMUyBkb2N1bWVudFN5bWJvbC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIHB1YmxpYyBwcm92aWRlT3V0bGluZXMoKTogYXRvbUlkZS5PdXRsaW5lUHJvdmlkZXIge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbmFtZTogdGhpcy5uYW1lLFxyXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcclxuICAgICAgcHJpb3JpdHk6IDEsXHJcbiAgICAgIGdldE91dGxpbmU6IHRoaXMuZ2V0T3V0bGluZS5iaW5kKHRoaXMpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPdXRsaW5lKGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8YXRvbUlkZS5PdXRsaW5lIHwgbnVsbD4ge1xyXG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcclxuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhT3V0bGluZVZpZXdBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMub3V0bGluZVZpZXcgPSB0aGlzLm91dGxpbmVWaWV3IHx8IG5ldyBPdXRsaW5lVmlld0FkYXB0ZXIoKTtcclxuICAgIHJldHVybiB0aGlzLm91dGxpbmVWaWV3LmdldE91dGxpbmUoc2VydmVyLmNvbm5lY3Rpb24sIGVkaXRvcik7XHJcbiAgfVxyXG5cclxuICAvLyBMaW50ZXIgcHVzaCB2MiBBUEkgdmlhIExTIHB1Ymxpc2hEaWFnbm9zdGljc1xyXG4gIHB1YmxpYyBjb25zdW1lTGludGVyVjIocmVnaXN0ZXJJbmRpZTogKHBhcmFtczoge25hbWU6IHN0cmluZ30pID0+IGxpbnRlci5JbmRpZURlbGVnYXRlKTogdm9pZCB7XHJcbiAgICB0aGlzLl9saW50ZXJEZWxlZ2F0ZSA9IHJlZ2lzdGVySW5kaWUoe25hbWU6IHRoaXMubmFtZX0pO1xyXG4gICAgaWYgKHRoaXMuX2xpbnRlckRlbGVnYXRlID09IG51bGwpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3Qgc2VydmVyIG9mIHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0QWN0aXZlU2VydmVycygpKSB7XHJcbiAgICAgIGNvbnN0IGxpbnRlclB1c2hWMiA9IHRoaXMuZ2V0U2VydmVyQWRhcHRlcihzZXJ2ZXIsICdsaW50ZXJQdXNoVjInKTtcclxuICAgICAgaWYgKGxpbnRlclB1c2hWMiAhPSBudWxsKSB7XHJcbiAgICAgICAgbGludGVyUHVzaFYyLmF0dGFjaCh0aGlzLl9saW50ZXJEZWxlZ2F0ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEZpbmQgUmVmZXJlbmNlcyB2aWEgTFMgZmluZFJlZmVyZW5jZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICBwdWJsaWMgcHJvdmlkZUZpbmRSZWZlcmVuY2VzKCk6IGF0b21JZGUuRmluZFJlZmVyZW5jZXNQcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBpc0VkaXRvclN1cHBvcnRlZDogKGVkaXRvcjogVGV4dEVkaXRvcikgPT4gdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCkuaW5jbHVkZXMoZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpLFxyXG4gICAgICBmaW5kUmVmZXJlbmNlczogdGhpcy5nZXRSZWZlcmVuY2VzLmJpbmQodGhpcyksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFJlZmVyZW5jZXMoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb2ludDogUG9pbnQpOiBQcm9taXNlPGF0b21JZGUuRmluZFJlZmVyZW5jZXNSZXR1cm4gfCBudWxsPiB7XHJcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xyXG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFGaW5kUmVmZXJlbmNlc0FkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5maW5kUmVmZXJlbmNlcyA9IHRoaXMuZmluZFJlZmVyZW5jZXMgfHwgbmV3IEZpbmRSZWZlcmVuY2VzQWRhcHRlcigpO1xyXG4gICAgcmV0dXJuIHRoaXMuZmluZFJlZmVyZW5jZXMuZ2V0UmVmZXJlbmNlcyhzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yLCBwb2ludCwgc2VydmVyLnByb2plY3RQYXRoKTtcclxuICB9XHJcblxyXG4gIC8vIERhdGF0aXAgdmlhIExTIHRleHREb2N1bWVudC9ob3Zlci0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICBwdWJsaWMgY29uc3VtZURhdGF0aXAoc2VydmljZTogYXRvbUlkZS5EYXRhdGlwU2VydmljZSk6IHZvaWQge1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoXHJcbiAgICAgIHNlcnZpY2UuYWRkUHJvdmlkZXIoe1xyXG4gICAgICAgIHByb3ZpZGVyTmFtZTogdGhpcy5uYW1lLFxyXG4gICAgICAgIHByaW9yaXR5OiAxLFxyXG4gICAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxyXG4gICAgICAgIHZhbGlkRm9yU2NvcGU6IChzY29wZU5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLmluY2x1ZGVzKHNjb3BlTmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkYXRhdGlwOiB0aGlzLmdldERhdGF0aXAuYmluZCh0aGlzKSxcclxuICAgICAgfSksXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGFzeW5jIGdldERhdGF0aXAoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb2ludDogUG9pbnQpOiBQcm9taXNlPGF0b21JZGUuRGF0YXRpcCB8IG51bGw+IHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XHJcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIURhdGF0aXBBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZGF0YXRpcCA9IHRoaXMuZGF0YXRpcCB8fCBuZXcgRGF0YXRpcEFkYXB0ZXIoKTtcclxuICAgIHJldHVybiB0aGlzLmRhdGF0aXAuZ2V0RGF0YXRpcChzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yLCBwb2ludCk7XHJcbiAgfVxyXG5cclxuICAvLyBDb25zb2xlIHZpYSBMUyBsb2dnaW5nLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgcHVibGljIGNvbnN1bWVDb25zb2xlKGNyZWF0ZUNvbnNvbGU6IGF0b21JZGUuQ29uc29sZVNlcnZpY2UpOiBEaXNwb3NhYmxlIHtcclxuICAgIHRoaXMuX2NvbnNvbGVEZWxlZ2F0ZSA9IGNyZWF0ZUNvbnNvbGU7XHJcblxyXG4gICAgZm9yIChjb25zdCBzZXJ2ZXIgb2YgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRBY3RpdmVTZXJ2ZXJzKCkpIHtcclxuICAgICAgY29uc3QgbG9nZ2luZ0NvbnNvbGUgPSB0aGlzLmdldFNlcnZlckFkYXB0ZXIoc2VydmVyLCAnbG9nZ2luZ0NvbnNvbGUnKTtcclxuICAgICAgaWYgKGxvZ2dpbmdDb25zb2xlKSB7XHJcbiAgICAgICAgbG9nZ2luZ0NvbnNvbGUuYXR0YWNoKHRoaXMuX2NvbnNvbGVEZWxlZ2F0ZSh7IGlkOiB0aGlzLm5hbWUsIG5hbWU6ICdhYmMnIH0pKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIE5vIHdheSBvZiBkZXRhY2hpbmcgZnJvbSBjbGllbnQgY29ubmVjdGlvbnMgdG9kYXlcclxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7IH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gQ29kZSBGb3JtYXQgdmlhIExTIGZvcm1hdERvY3VtZW50ICYgZm9ybWF0RG9jdW1lbnRSYW5nZS0tLS0tLS0tLS0tLVxyXG4gIHB1YmxpYyBwcm92aWRlQ29kZUZvcm1hdCgpOiBhdG9tSWRlLlJhbmdlQ29kZUZvcm1hdFByb3ZpZGVyIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGdyYW1tYXJTY29wZXM6IHRoaXMuZ2V0R3JhbW1hclNjb3BlcygpLFxyXG4gICAgICBwcmlvcml0eTogMSxcclxuICAgICAgZm9ybWF0Q29kZTogdGhpcy5nZXRDb2RlRm9ybWF0LmJpbmQodGhpcyksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGFzeW5jIGdldENvZGVGb3JtYXQoZWRpdG9yOiBUZXh0RWRpdG9yLCByYW5nZTogUmFuZ2UpOiBQcm9taXNlPGF0b21JZGUuVGV4dEVkaXRbXT4ge1xyXG4gICAgY29uc3Qgc2VydmVyID0gYXdhaXQgdGhpcy5fc2VydmVyTWFuYWdlci5nZXRTZXJ2ZXIoZWRpdG9yKTtcclxuICAgIGlmIChzZXJ2ZXIgPT0gbnVsbCB8fCAhQ29kZUZvcm1hdEFkYXB0ZXIuY2FuQWRhcHQoc2VydmVyLmNhcGFiaWxpdGllcykpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXQoc2VydmVyLmNvbm5lY3Rpb24sIHNlcnZlci5jYXBhYmlsaXRpZXMsIGVkaXRvciwgcmFuZ2UpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHByb3ZpZGVSYW5nZUNvZGVGb3JtYXQoKTogYXRvbUlkZS5SYW5nZUNvZGVGb3JtYXRQcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcclxuICAgICAgcHJpb3JpdHk6IDEsXHJcbiAgICAgIGZvcm1hdENvZGU6IHRoaXMuZ2V0UmFuZ2VDb2RlRm9ybWF0LmJpbmQodGhpcyksXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGFzeW5jIGdldFJhbmdlQ29kZUZvcm1hdChlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSk6IFByb21pc2U8YXRvbUlkZS5UZXh0RWRpdFtdPiB7XHJcbiAgICBjb25zdCBzZXJ2ZXIgPSBhd2FpdCB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldFNlcnZlcihlZGl0b3IpO1xyXG4gICAgaWYgKHNlcnZlciA9PSBudWxsIHx8ICFzZXJ2ZXIuY2FwYWJpbGl0aWVzLmRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUHJvdmlkZXIpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXRSYW5nZShzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yLCByYW5nZSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcHJvdmlkZUZpbGVDb2RlRm9ybWF0KCk6IGF0b21JZGUuRmlsZUNvZGVGb3JtYXRQcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcclxuICAgICAgcHJpb3JpdHk6IDEsXHJcbiAgICAgIGZvcm1hdEVudGlyZUZpbGU6IHRoaXMuZ2V0RmlsZUNvZGVGb3JtYXQuYmluZCh0aGlzKSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcHJvdmlkZU9uU2F2ZUNvZGVGb3JtYXQoKTogYXRvbUlkZS5PblNhdmVDb2RlRm9ybWF0UHJvdmlkZXIge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXHJcbiAgICAgIHByaW9yaXR5OiAxLFxyXG4gICAgICBmb3JtYXRPblNhdmU6IHRoaXMuZ2V0RmlsZUNvZGVGb3JtYXQuYmluZCh0aGlzKSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0RmlsZUNvZGVGb3JtYXQoZWRpdG9yOiBUZXh0RWRpdG9yKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XHJcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIXNlcnZlci5jYXBhYmlsaXRpZXMuZG9jdW1lbnRGb3JtYXR0aW5nUHJvdmlkZXIpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXREb2N1bWVudChzZXJ2ZXIuY29ubmVjdGlvbiwgZWRpdG9yKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwcm92aWRlT25UeXBlQ29kZUZvcm1hdCgpOiBhdG9tSWRlLk9uVHlwZUNvZGVGb3JtYXRQcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcclxuICAgICAgcHJpb3JpdHk6IDEsXHJcbiAgICAgIGZvcm1hdEF0UG9zaXRpb246IHRoaXMuZ2V0T25UeXBlQ29kZUZvcm1hdC5iaW5kKHRoaXMpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhc3luYyBnZXRPblR5cGVDb2RlRm9ybWF0KFxyXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAgcG9pbnQ6IFBvaW50LFxyXG4gICAgY2hhcmFjdGVyOiBzdHJpbmcsXHJcbiAgKTogUHJvbWlzZTxhdG9tSWRlLlRleHRFZGl0W10+IHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XHJcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIXNlcnZlci5jYXBhYmlsaXRpZXMuZG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nUHJvdmlkZXIpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDb2RlRm9ybWF0QWRhcHRlci5mb3JtYXRPblR5cGUoc2VydmVyLmNvbm5lY3Rpb24sIGVkaXRvciwgcG9pbnQsIGNoYXJhY3Rlcik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcHJvdmlkZUNvZGVIaWdobGlnaHQoKTogYXRvbUlkZS5Db2RlSGlnaGxpZ2h0UHJvdmlkZXIge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZ3JhbW1hclNjb3BlczogdGhpcy5nZXRHcmFtbWFyU2NvcGVzKCksXHJcbiAgICAgIHByaW9yaXR5OiAxLFxyXG4gICAgICBoaWdobGlnaHQ6IChlZGl0b3IsIHBvc2l0aW9uKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29kZUhpZ2hsaWdodChlZGl0b3IsIHBvc2l0aW9uKTtcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0Q29kZUhpZ2hsaWdodChlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFByb21pc2U8UmFuZ2VbXSB8IG51bGw+IHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XHJcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIUNvZGVIaWdobGlnaHRBZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDb2RlSGlnaGxpZ2h0QWRhcHRlci5oaWdobGlnaHQoc2VydmVyLmNvbm5lY3Rpb24sIHNlcnZlci5jYXBhYmlsaXRpZXMsIGVkaXRvciwgcG9zaXRpb24pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHByb3ZpZGVDb2RlQWN0aW9ucygpOiBhdG9tSWRlLkNvZGVBY3Rpb25Qcm92aWRlciB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBncmFtbWFyU2NvcGVzOiB0aGlzLmdldEdyYW1tYXJTY29wZXMoKSxcclxuICAgICAgcHJpb3JpdHk6IDEsXHJcbiAgICAgIGdldENvZGVBY3Rpb25zOiAoZWRpdG9yLCByYW5nZSwgZGlhZ25vc3RpY3MpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb2RlQWN0aW9ucyhlZGl0b3IsIHJhbmdlLCBkaWFnbm9zdGljcyk7XHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGFzeW5jIGdldENvZGVBY3Rpb25zKGVkaXRvcjogVGV4dEVkaXRvciwgcmFuZ2U6IFJhbmdlLCBkaWFnbm9zdGljczogYXRvbUlkZS5EaWFnbm9zdGljW10pIHtcclxuICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuX3NlcnZlck1hbmFnZXIuZ2V0U2VydmVyKGVkaXRvcik7XHJcbiAgICBpZiAoc2VydmVyID09IG51bGwgfHwgIUNvZGVBY3Rpb25BZGFwdGVyLmNhbkFkYXB0KHNlcnZlci5jYXBhYmlsaXRpZXMpKSB7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBDb2RlQWN0aW9uQWRhcHRlci5nZXRDb2RlQWN0aW9ucyhcclxuICAgICAgc2VydmVyLmNvbm5lY3Rpb24sXHJcbiAgICAgIHNlcnZlci5jYXBhYmlsaXRpZXMsXHJcbiAgICAgIHRoaXMuZ2V0U2VydmVyQWRhcHRlcihzZXJ2ZXIsICdsaW50ZXJQdXNoVjInKSxcclxuICAgICAgZWRpdG9yLFxyXG4gICAgICByYW5nZSxcclxuICAgICAgZGlhZ25vc3RpY3MsXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbnN1bWVTaWduYXR1cmVIZWxwKHJlZ2lzdHJ5OiBhdG9tSWRlLlNpZ25hdHVyZUhlbHBSZWdpc3RyeSk6IERpc3Bvc2FibGUge1xyXG4gICAgdGhpcy5fc2lnbmF0dXJlSGVscFJlZ2lzdHJ5ID0gcmVnaXN0cnk7XHJcbiAgICBmb3IgKGNvbnN0IHNlcnZlciBvZiB0aGlzLl9zZXJ2ZXJNYW5hZ2VyLmdldEFjdGl2ZVNlcnZlcnMoKSkge1xyXG4gICAgICBjb25zdCBzaWduYXR1cmVIZWxwQWRhcHRlciA9IHRoaXMuZ2V0U2VydmVyQWRhcHRlcihzZXJ2ZXIsICdzaWduYXR1cmVIZWxwQWRhcHRlcicpO1xyXG4gICAgICBpZiAoc2lnbmF0dXJlSGVscEFkYXB0ZXIgIT0gbnVsbCkge1xyXG4gICAgICAgIHNpZ25hdHVyZUhlbHBBZGFwdGVyLmF0dGFjaChyZWdpc3RyeSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XHJcbiAgICAgIHRoaXMuX3NpZ25hdHVyZUhlbHBSZWdpc3RyeSA9IHVuZGVmaW5lZDtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNvbnN1bWVCdXN5U2lnbmFsKHNlcnZpY2U6IGF0b21JZGUuQnVzeVNpZ25hbFNlcnZpY2UpOiBEaXNwb3NhYmxlIHtcclxuICAgIHRoaXMuYnVzeVNpZ25hbFNlcnZpY2UgPSBzZXJ2aWNlO1xyXG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IGRlbGV0ZSB0aGlzLmJ1c3lTaWduYWxTZXJ2aWNlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIGBkaWRDaGFuZ2VXYXRjaGVkRmlsZXNgIG1lc3NhZ2UgZmlsdGVyaW5nLCBvdmVycmlkZSBmb3IgY3VzdG9tIGxvZ2ljLlxyXG4gICAqIEBwYXJhbSBmaWxlUGF0aCBwYXRoIG9mIGEgZmlsZSB0aGF0IGhhcyBjaGFuZ2VkIGluIHRoZSBwcm9qZWN0IHBhdGhcclxuICAgKiBAcmV0dXJuIGZhbHNlID0+IG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2VudCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGZpbHRlckNoYW5nZVdhdGNoZWRGaWxlcyhmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBvbiBsYW5ndWFnZSBzZXJ2ZXIgc3RkZXJyIG91dHB1dC5cclxuICAgKiBAcGFyYW0gc3RkZXJyIGEgY2h1bmsgb2Ygc3RkZXJyIGZyb20gYSBsYW5ndWFnZSBzZXJ2ZXIgaW5zdGFuY2VcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgaGFuZGxlU2VydmVyU3RkZXJyKHN0ZGVycjogc3RyaW5nLCBwcm9qZWN0UGF0aDogc3RyaW5nKSB7XHJcbiAgICBzdGRlcnIuc3BsaXQoJ1xcbicpLmZpbHRlcigobCkgPT4gbCkuZm9yRWFjaCgobGluZSkgPT4gdGhpcy5sb2dnZXIud2Fybihgc3RkZXJyICR7bGluZX1gKSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGdldFNlcnZlckFkYXB0ZXI8VCBleHRlbmRzIGtleW9mIFNlcnZlckFkYXB0ZXJzPihcclxuICAgIHNlcnZlcjogQWN0aXZlU2VydmVyLCBhZGFwdGVyOiBULFxyXG4gICk6IFNlcnZlckFkYXB0ZXJzW1RdIHwgdW5kZWZpbmVkIHtcclxuICAgIGNvbnN0IGFkYXB0ZXJzID0gdGhpcy5fc2VydmVyQWRhcHRlcnMuZ2V0KHNlcnZlcik7XHJcbiAgICByZXR1cm4gYWRhcHRlcnMgJiYgYWRhcHRlcnNbYWRhcHRlcl07XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgcmVwb3J0QnVzeVdoaWxlOiBVdGlscy5SZXBvcnRCdXN5V2hpbGUgPSBhc3luYyAodGl0bGUsIGYpID0+IHtcclxuICAgIGlmICh0aGlzLmJ1c3lTaWduYWxTZXJ2aWNlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmJ1c3lTaWduYWxTZXJ2aWNlLnJlcG9ydEJ1c3lXaGlsZSh0aXRsZSwgZik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdGhpcy5yZXBvcnRCdXN5V2hpbGVEZWZhdWx0KHRpdGxlLCBmKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCByZXBvcnRCdXN5V2hpbGVEZWZhdWx0OiBVdGlscy5SZXBvcnRCdXN5V2hpbGUgPSBhc3luYyAodGl0bGUsIGYpID0+IHtcclxuICAgIHRoaXMubG9nZ2VyLmluZm8oYFtTdGFydGVkXSAke3RpdGxlfWApO1xyXG4gICAgbGV0IHJlcztcclxuICAgIHRyeSB7XHJcbiAgICAgIHJlcyA9IGF3YWl0IGYoKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHRoaXMubG9nZ2VyLmluZm8oYFtGaW5pc2hlZF0gJHt0aXRsZX1gKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXM7XHJcbiAgfVxyXG59XHJcbiJdfQ==

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/convert.js":
/*!***************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/convert.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const ls = __webpack_require__(/*! ./languageclient */ "./node_modules/atom-languageclient/build/lib/languageclient.js");
const URL = __webpack_require__(/*! url */ "url");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
// Public: Class that contains a number of helper methods for general conversions
// between the language server protocol and Atom/Atom packages.
class Convert {
    // Public: Convert a path to a Uri.
    //
    // * `filePath` A file path to convert to a Uri.
    //
    // Returns the Uri corresponding to the path. e.g. file:///a/b/c.txt
    static pathToUri(filePath) {
        let newPath = filePath.replace(/\\/g, '/');
        if (newPath[0] !== '/') {
            newPath = `/${newPath}`;
        }
        return encodeURI(`file://${newPath}`).replace(/[?#]/g, encodeURIComponent);
    }
    // Public: Convert a Uri to a path.
    //
    // * `uri` A Uri to convert to a file path.
    //
    // Returns a file path corresponding to the Uri. e.g. /a/b/c.txt
    // If the Uri does not begin file: then it is returned as-is to allow Atom
    // to deal with http/https sources in the future.
    static uriToPath(uri) {
        const url = URL.parse(uri);
        if (url.protocol !== 'file:' || url.path === undefined) {
            return uri;
        }
        let filePath = decodeURIComponent(url.path);
        if (process.platform === 'win32') {
            // Deal with Windows drive names
            if (filePath[0] === '/') {
                filePath = filePath.substr(1);
            }
            return filePath.replace(/\//g, '\\');
        }
        return filePath;
    }
    // Public: Convert an Atom {Point} to a language server {Position}.
    //
    // * `point` An Atom {Point} to convert from.
    //
    // Returns the {Position} representation of the Atom {PointObject}.
    static pointToPosition(point) {
        return { line: point.row, character: point.column };
    }
    // Public: Convert a language server {Position} into an Atom {PointObject}.
    //
    // * 'position' A language server {Position} to convert from.
    //
    // Returns the Atom {PointObject} representation of the given {Position}.
    static positionToPoint(position) {
        return new atom_1.Point(position.line, position.character);
    }
    // Public: Convert a language server {Range} into an Atom {Range}.
    //
    // * 'range' A language server {Range} to convert from.
    //
    // Returns the Atom {Range} representation of the given language server {Range}.
    static lsRangeToAtomRange(range) {
        return new atom_1.Range(Convert.positionToPoint(range.start), Convert.positionToPoint(range.end));
    }
    // Public: Convert an Atom {Range} into an language server {Range}.
    //
    // * 'range' An Atom {Range} to convert from.
    //
    // Returns the language server {Range} representation of the given Atom {Range}.
    static atomRangeToLSRange(range) {
        return {
            start: Convert.pointToPosition(range.start),
            end: Convert.pointToPosition(range.end),
        };
    }
    // Public: Create a {TextDocumentIdentifier} from an Atom {TextEditor}.
    //
    // * `editor` A {TextEditor} that will be used to form the uri property.
    //
    // Returns a {TextDocumentIdentifier} that has a `uri` property with the Uri for the
    // given editor's path.
    static editorToTextDocumentIdentifier(editor) {
        return { uri: Convert.pathToUri(editor.getPath() || '') };
    }
    // Public: Create a {TextDocumentPositionParams} from a {TextEditor} and optional {Point}.
    //
    // * `editor` A {TextEditor} that will be used to form the uri property.
    // * `point`  An optional {Point} that will supply the position property. If not specified
    //            the current cursor position will be used.
    //
    // Returns a {TextDocumentPositionParams} that has textDocument property with the editors {TextDocumentIdentifier}
    // and a position property with the supplied point (or current cursor position when not specified).
    static editorToTextDocumentPositionParams(editor, point) {
        return {
            textDocument: Convert.editorToTextDocumentIdentifier(editor),
            position: Convert.pointToPosition(point != null ? point : editor.getCursorBufferPosition()),
        };
    }
    // Public: Create a string of scopes for the atom text editor using the data-grammar selector from an
    // {Array} of grammarScope strings.
    //
    // * `grammarScopes` An {Array} of grammar scope string to convert from.
    //
    // Returns a single comma-separated list of CSS selectors targetting the grammars of Atom text editors.
    // e.g. `['c', 'cpp']` => `'atom-text-editor[data-grammar='c'], atom-text-editor[data-grammar='cpp']`
    static grammarScopesToTextEditorScopes(grammarScopes) {
        return grammarScopes
            .map((g) => `atom-text-editor[data-grammar="${Convert.encodeHTMLAttribute(g.replace(/\./g, ' '))}"]`)
            .join(', ');
    }
    // Public: Encode a string so that it can be safely used within a HTML attribute - i.e. replacing all quoted
    // values with their HTML entity encoded versions.  e.g. `Hello"` becomes `Hello&quot;`
    //
    // * 's' A string to be encoded.
    //
    // Returns a string that is HTML attribute encoded by replacing &, <, >, " and ' with their HTML entity
    // named equivalents.
    static encodeHTMLAttribute(s) {
        const attributeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;',
        };
        return s.replace(/[&<>'"]/g, (c) => attributeMap[c]);
    }
    // Public: Convert an Atom File Event as received from atom.project.onDidChangeFiles and convert
    // it into an Array of Language Server Protocol {FileEvent} objects. Normally this will be a 1-to-1
    // but renames will be represented by a deletion and a subsequent creation as LSP does not know about
    // renames.
    //
    // * 'fileEvent' An {atom$ProjectFileEvent} to be converted.
    //
    // Returns an array of LSP {ls.FileEvent} objects that equivalent conversions to the fileEvent parameter.
    static atomFileEventToLSFileEvents(fileEvent) {
        switch (fileEvent.action) {
            case 'created':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Created }];
            case 'modified':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Changed }];
            case 'deleted':
                return [{ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Deleted }];
            case 'renamed': {
                const results = [];
                if (fileEvent.oldPath) {
                    results.push({ uri: Convert.pathToUri(fileEvent.oldPath), type: ls.FileChangeType.Deleted });
                }
                if (fileEvent.path) {
                    results.push({ uri: Convert.pathToUri(fileEvent.path), type: ls.FileChangeType.Created });
                }
                return results;
            }
            default:
                return [];
        }
    }
    static atomIdeDiagnosticToLSDiagnostic(diagnostic) {
        return {
            range: Convert.atomRangeToLSRange(diagnostic.range),
            severity: Convert.diagnosticTypeToLSSeverity(diagnostic.type),
            source: diagnostic.providerName,
            message: diagnostic.text || '',
        };
    }
    static diagnosticTypeToLSSeverity(type) {
        switch (type) {
            case 'Error':
                return ls.DiagnosticSeverity.Error;
            case 'Warning':
                return ls.DiagnosticSeverity.Warning;
            case 'Info':
                return ls.DiagnosticSeverity.Information;
            default:
                throw Error(`Unexpected diagnostic type ${type}`);
        }
    }
    // Public: Convert an array of language server protocol {TextEdit} objects to an
    // equivalent array of Atom {TextEdit} objects.
    //
    // * `textEdits` The language server protocol {TextEdit} objects to convert.
    //
    // Returns an {Array} of Atom {TextEdit} objects.
    static convertLsTextEdits(textEdits) {
        return (textEdits || []).map(Convert.convertLsTextEdit);
    }
    // Public: Convert a language server protocol {TextEdit} object to the
    // Atom equivalent {TextEdit}.
    //
    // * `textEdits` The language server protocol {TextEdit} objects to convert.
    //
    // Returns an Atom {TextEdit} object.
    static convertLsTextEdit(textEdit) {
        return {
            oldRange: Convert.lsRangeToAtomRange(textEdit.range),
            newText: textEdit.newText,
        };
    }
}
exports.default = Convert;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb252ZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsdUNBQXVDO0FBQ3ZDLDJCQUEyQjtBQUMzQiwrQkFLYztBQU9kLGlGQUFpRjtBQUNqRiwrREFBK0Q7QUFDL0QsTUFBcUIsT0FBTztJQUMxQixtQ0FBbUM7SUFDbkMsRUFBRTtJQUNGLGdEQUFnRDtJQUNoRCxFQUFFO0lBQ0Ysb0VBQW9FO0lBQzdELE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBZ0I7UUFDdEMsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0MsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ3RCLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxTQUFTLENBQUMsVUFBVSxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQsbUNBQW1DO0lBQ25DLEVBQUU7SUFDRiwyQ0FBMkM7SUFDM0MsRUFBRTtJQUNGLGdFQUFnRTtJQUNoRSwwRUFBMEU7SUFDMUUsaURBQWlEO0lBQzFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBVztRQUNqQyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDdEQsT0FBTyxHQUFHLENBQUM7U0FDWjtRQUVELElBQUksUUFBUSxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1QyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO1lBQ2hDLGdDQUFnQztZQUNoQyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7Z0JBQ3ZCLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQy9CO1lBQ0QsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN0QztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxtRUFBbUU7SUFDbkUsRUFBRTtJQUNGLDZDQUE2QztJQUM3QyxFQUFFO0lBQ0YsbUVBQW1FO0lBQzVELE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBWTtRQUN4QyxPQUFPLEVBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQsMkVBQTJFO0lBQzNFLEVBQUU7SUFDRiw2REFBNkQ7SUFDN0QsRUFBRTtJQUNGLHlFQUF5RTtJQUNsRSxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQXFCO1FBQ2pELE9BQU8sSUFBSSxZQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELGtFQUFrRTtJQUNsRSxFQUFFO0lBQ0YsdURBQXVEO0lBQ3ZELEVBQUU7SUFDRixnRkFBZ0Y7SUFDekUsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEtBQWU7UUFDOUMsT0FBTyxJQUFJLFlBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFRCxtRUFBbUU7SUFDbkUsRUFBRTtJQUNGLDZDQUE2QztJQUM3QyxFQUFFO0lBQ0YsZ0ZBQWdGO0lBQ3pFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxLQUFZO1FBQzNDLE9BQU87WUFDTCxLQUFLLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQzNDLEdBQUcsRUFBRSxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7U0FDeEMsQ0FBQztJQUNKLENBQUM7SUFFRCx1RUFBdUU7SUFDdkUsRUFBRTtJQUNGLHdFQUF3RTtJQUN4RSxFQUFFO0lBQ0Ysb0ZBQW9GO0lBQ3BGLHVCQUF1QjtJQUNoQixNQUFNLENBQUMsOEJBQThCLENBQUMsTUFBa0I7UUFDN0QsT0FBTyxFQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBQyxDQUFDO0lBQzFELENBQUM7SUFFRCwwRkFBMEY7SUFDMUYsRUFBRTtJQUNGLHdFQUF3RTtJQUN4RSwwRkFBMEY7SUFDMUYsdURBQXVEO0lBQ3ZELEVBQUU7SUFDRixrSEFBa0g7SUFDbEgsbUdBQW1HO0lBQzVGLE1BQU0sQ0FBQyxrQ0FBa0MsQ0FDOUMsTUFBa0IsRUFDbEIsS0FBYTtRQUViLE9BQU87WUFDTCxZQUFZLEVBQUUsT0FBTyxDQUFDLDhCQUE4QixDQUFDLE1BQU0sQ0FBQztZQUM1RCxRQUFRLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1NBQzVGLENBQUM7SUFDSixDQUFDO0lBRUQscUdBQXFHO0lBQ3JHLG1DQUFtQztJQUNuQyxFQUFFO0lBQ0Ysd0VBQXdFO0lBQ3hFLEVBQUU7SUFDRix1R0FBdUc7SUFDdkcscUdBQXFHO0lBQzlGLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxhQUF1QjtRQUNuRSxPQUFPLGFBQWE7YUFDakIsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxrQ0FBa0MsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQzthQUNwRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVELDRHQUE0RztJQUM1Ryx1RkFBdUY7SUFDdkYsRUFBRTtJQUNGLGdDQUFnQztJQUNoQyxFQUFFO0lBQ0YsdUdBQXVHO0lBQ3ZHLHFCQUFxQjtJQUNkLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFTO1FBQ3pDLE1BQU0sWUFBWSxHQUE4QjtZQUM5QyxHQUFHLEVBQUUsT0FBTztZQUNaLEdBQUcsRUFBRSxNQUFNO1lBQ1gsR0FBRyxFQUFFLE1BQU07WUFDWCxHQUFHLEVBQUUsUUFBUTtZQUNiLEdBQUcsRUFBRSxRQUFRO1NBQ2QsQ0FBQztRQUNGLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxnR0FBZ0c7SUFDaEcsbUdBQW1HO0lBQ25HLHFHQUFxRztJQUNyRyxXQUFXO0lBQ1gsRUFBRTtJQUNGLDREQUE0RDtJQUM1RCxFQUFFO0lBQ0YseUdBQXlHO0lBQ2xHLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxTQUEyQjtRQUNuRSxRQUFRLFNBQVMsQ0FBQyxNQUFNLEVBQUU7WUFDeEIsS0FBSyxTQUFTO2dCQUNaLE9BQU8sQ0FBQyxFQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO1lBQ3JGLEtBQUssVUFBVTtnQkFDYixPQUFPLENBQUMsRUFBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQztZQUNyRixLQUFLLFNBQVM7Z0JBQ1osT0FBTyxDQUFDLEVBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7WUFDckYsS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDZCxNQUFNLE9BQU8sR0FBb0QsRUFBRSxDQUFDO2dCQUNwRSxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUU7b0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQztpQkFDNUY7Z0JBQ0QsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFO29CQUNsQixPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7aUJBQ3pGO2dCQUNELE9BQU8sT0FBTyxDQUFDO2FBQ2hCO1lBQ0Q7Z0JBQ0UsT0FBTyxFQUFFLENBQUM7U0FDYjtJQUNILENBQUM7SUFFTSxNQUFNLENBQUMsK0JBQStCLENBQUMsVUFBc0I7UUFDbEUsT0FBTztZQUNMLEtBQUssRUFBRSxPQUFPLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUNuRCxRQUFRLEVBQUUsT0FBTyxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDN0QsTUFBTSxFQUFFLFVBQVUsQ0FBQyxZQUFZO1lBQy9CLE9BQU8sRUFBRSxVQUFVLENBQUMsSUFBSSxJQUFJLEVBQUU7U0FDL0IsQ0FBQztJQUNKLENBQUM7SUFFTSxNQUFNLENBQUMsMEJBQTBCLENBQUMsSUFBb0I7UUFDM0QsUUFBUSxJQUFJLEVBQUU7WUFDWixLQUFLLE9BQU87Z0JBQ1YsT0FBTyxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ3JDLEtBQUssU0FBUztnQkFDWixPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDdkMsS0FBSyxNQUFNO2dCQUNULE9BQU8sRUFBRSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQztZQUMzQztnQkFDRSxNQUFNLEtBQUssQ0FBQyw4QkFBOEIsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUNyRDtJQUNILENBQUM7SUFFRCxnRkFBZ0Y7SUFDaEYsK0NBQStDO0lBQy9DLEVBQUU7SUFDRiw0RUFBNEU7SUFDNUUsRUFBRTtJQUNGLGlEQUFpRDtJQUMxQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsU0FBK0I7UUFDOUQsT0FBTyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDMUQsQ0FBQztJQUVELHNFQUFzRTtJQUN0RSw4QkFBOEI7SUFDOUIsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSxFQUFFO0lBQ0YscUNBQXFDO0lBQzlCLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFxQjtRQUNuRCxPQUFPO1lBQ0wsUUFBUSxFQUFFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1lBQ3BELE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztTQUMxQixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBbk5ELDBCQW1OQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgKiBhcyBscyBmcm9tICcuL2xhbmd1YWdlY2xpZW50JztcclxuaW1wb3J0ICogYXMgVVJMIGZyb20gJ3VybCc7XHJcbmltcG9ydCB7XHJcbiAgUG9pbnQsXHJcbiAgRmlsZXN5c3RlbUNoYW5nZSxcclxuICBSYW5nZSxcclxuICBUZXh0RWRpdG9yLFxyXG59IGZyb20gJ2F0b20nO1xyXG5pbXBvcnQge1xyXG4gIERpYWdub3N0aWMsXHJcbiAgRGlhZ25vc3RpY1R5cGUsXHJcbiAgVGV4dEVkaXQsXHJcbn0gZnJvbSAnYXRvbS1pZGUnO1xyXG5cclxuLy8gUHVibGljOiBDbGFzcyB0aGF0IGNvbnRhaW5zIGEgbnVtYmVyIG9mIGhlbHBlciBtZXRob2RzIGZvciBnZW5lcmFsIGNvbnZlcnNpb25zXHJcbi8vIGJldHdlZW4gdGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCBhbmQgQXRvbS9BdG9tIHBhY2thZ2VzLlxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb252ZXJ0IHtcclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBwYXRoIHRvIGEgVXJpLlxyXG4gIC8vXHJcbiAgLy8gKiBgZmlsZVBhdGhgIEEgZmlsZSBwYXRoIHRvIGNvbnZlcnQgdG8gYSBVcmkuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIHRoZSBVcmkgY29ycmVzcG9uZGluZyB0byB0aGUgcGF0aC4gZS5nLiBmaWxlOi8vL2EvYi9jLnR4dFxyXG4gIHB1YmxpYyBzdGF0aWMgcGF0aFRvVXJpKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgbGV0IG5ld1BhdGggPSBmaWxlUGF0aC5yZXBsYWNlKC9cXFxcL2csICcvJyk7XHJcbiAgICBpZiAobmV3UGF0aFswXSAhPT0gJy8nKSB7XHJcbiAgICAgIG5ld1BhdGggPSBgLyR7bmV3UGF0aH1gO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGVuY29kZVVSSShgZmlsZTovLyR7bmV3UGF0aH1gKS5yZXBsYWNlKC9bPyNdL2csIGVuY29kZVVSSUNvbXBvbmVudCk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBVcmkgdG8gYSBwYXRoLlxyXG4gIC8vXHJcbiAgLy8gKiBgdXJpYCBBIFVyaSB0byBjb252ZXJ0IHRvIGEgZmlsZSBwYXRoLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhIGZpbGUgcGF0aCBjb3JyZXNwb25kaW5nIHRvIHRoZSBVcmkuIGUuZy4gL2EvYi9jLnR4dFxyXG4gIC8vIElmIHRoZSBVcmkgZG9lcyBub3QgYmVnaW4gZmlsZTogdGhlbiBpdCBpcyByZXR1cm5lZCBhcy1pcyB0byBhbGxvdyBBdG9tXHJcbiAgLy8gdG8gZGVhbCB3aXRoIGh0dHAvaHR0cHMgc291cmNlcyBpbiB0aGUgZnV0dXJlLlxyXG4gIHB1YmxpYyBzdGF0aWMgdXJpVG9QYXRoKHVyaTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIGNvbnN0IHVybCA9IFVSTC5wYXJzZSh1cmkpO1xyXG4gICAgaWYgKHVybC5wcm90b2NvbCAhPT0gJ2ZpbGU6JyB8fCB1cmwucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiB1cmk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGZpbGVQYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KHVybC5wYXRoKTtcclxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XHJcbiAgICAgIC8vIERlYWwgd2l0aCBXaW5kb3dzIGRyaXZlIG5hbWVzXHJcbiAgICAgIGlmIChmaWxlUGF0aFswXSA9PT0gJy8nKSB7XHJcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5zdWJzdHIoMSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZpbGVQYXRoLnJlcGxhY2UoL1xcLy9nLCAnXFxcXCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZpbGVQYXRoO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIEF0b20ge1BvaW50fSB0byBhIGxhbmd1YWdlIHNlcnZlciB7UG9zaXRpb259LlxyXG4gIC8vXHJcbiAgLy8gKiBgcG9pbnRgIEFuIEF0b20ge1BvaW50fSB0byBjb252ZXJ0IGZyb20uXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIHRoZSB7UG9zaXRpb259IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBBdG9tIHtQb2ludE9iamVjdH0uXHJcbiAgcHVibGljIHN0YXRpYyBwb2ludFRvUG9zaXRpb24ocG9pbnQ6IFBvaW50KTogbHMuUG9zaXRpb24ge1xyXG4gICAgcmV0dXJuIHtsaW5lOiBwb2ludC5yb3csIGNoYXJhY3RlcjogcG9pbnQuY29sdW1ufTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciB7UG9zaXRpb259IGludG8gYW4gQXRvbSB7UG9pbnRPYmplY3R9LlxyXG4gIC8vXHJcbiAgLy8gKiAncG9zaXRpb24nIEEgbGFuZ3VhZ2Ugc2VydmVyIHtQb3NpdGlvbn0gdG8gY29udmVydCBmcm9tLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyB0aGUgQXRvbSB7UG9pbnRPYmplY3R9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiB7UG9zaXRpb259LlxyXG4gIHB1YmxpYyBzdGF0aWMgcG9zaXRpb25Ub1BvaW50KHBvc2l0aW9uOiBscy5Qb3NpdGlvbik6IFBvaW50IHtcclxuICAgIHJldHVybiBuZXcgUG9pbnQocG9zaXRpb24ubGluZSwgcG9zaXRpb24uY2hhcmFjdGVyKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciB7UmFuZ2V9IGludG8gYW4gQXRvbSB7UmFuZ2V9LlxyXG4gIC8vXHJcbiAgLy8gKiAncmFuZ2UnIEEgbGFuZ3VhZ2Ugc2VydmVyIHtSYW5nZX0gdG8gY29udmVydCBmcm9tLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyB0aGUgQXRvbSB7UmFuZ2V9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBsYW5ndWFnZSBzZXJ2ZXIge1JhbmdlfS5cclxuICBwdWJsaWMgc3RhdGljIGxzUmFuZ2VUb0F0b21SYW5nZShyYW5nZTogbHMuUmFuZ2UpOiBSYW5nZSB7XHJcbiAgICByZXR1cm4gbmV3IFJhbmdlKENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHJhbmdlLnN0YXJ0KSwgQ29udmVydC5wb3NpdGlvblRvUG9pbnQocmFuZ2UuZW5kKSk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gQXRvbSB7UmFuZ2V9IGludG8gYW4gbGFuZ3VhZ2Ugc2VydmVyIHtSYW5nZX0uXHJcbiAgLy9cclxuICAvLyAqICdyYW5nZScgQW4gQXRvbSB7UmFuZ2V9IHRvIGNvbnZlcnQgZnJvbS5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgdGhlIGxhbmd1YWdlIHNlcnZlciB7UmFuZ2V9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBBdG9tIHtSYW5nZX0uXHJcbiAgcHVibGljIHN0YXRpYyBhdG9tUmFuZ2VUb0xTUmFuZ2UocmFuZ2U6IFJhbmdlKTogbHMuUmFuZ2Uge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhcnQ6IENvbnZlcnQucG9pbnRUb1Bvc2l0aW9uKHJhbmdlLnN0YXJ0KSxcclxuICAgICAgZW5kOiBDb252ZXJ0LnBvaW50VG9Qb3NpdGlvbihyYW5nZS5lbmQpLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ3JlYXRlIGEge1RleHREb2N1bWVudElkZW50aWZpZXJ9IGZyb20gYW4gQXRvbSB7VGV4dEVkaXRvcn0uXHJcbiAgLy9cclxuICAvLyAqIGBlZGl0b3JgIEEge1RleHRFZGl0b3J9IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZvcm0gdGhlIHVyaSBwcm9wZXJ0eS5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7VGV4dERvY3VtZW50SWRlbnRpZmllcn0gdGhhdCBoYXMgYSBgdXJpYCBwcm9wZXJ0eSB3aXRoIHRoZSBVcmkgZm9yIHRoZVxyXG4gIC8vIGdpdmVuIGVkaXRvcidzIHBhdGguXHJcbiAgcHVibGljIHN0YXRpYyBlZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yOiBUZXh0RWRpdG9yKTogbHMuVGV4dERvY3VtZW50SWRlbnRpZmllciB7XHJcbiAgICByZXR1cm4ge3VyaTogQ29udmVydC5wYXRoVG9VcmkoZWRpdG9yLmdldFBhdGgoKSB8fCAnJyl9O1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBDcmVhdGUgYSB7VGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXN9IGZyb20gYSB7VGV4dEVkaXRvcn0gYW5kIG9wdGlvbmFsIHtQb2ludH0uXHJcbiAgLy9cclxuICAvLyAqIGBlZGl0b3JgIEEge1RleHRFZGl0b3J9IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZvcm0gdGhlIHVyaSBwcm9wZXJ0eS5cclxuICAvLyAqIGBwb2ludGAgIEFuIG9wdGlvbmFsIHtQb2ludH0gdGhhdCB3aWxsIHN1cHBseSB0aGUgcG9zaXRpb24gcHJvcGVydHkuIElmIG5vdCBzcGVjaWZpZWRcclxuICAvLyAgICAgICAgICAgIHRoZSBjdXJyZW50IGN1cnNvciBwb3NpdGlvbiB3aWxsIGJlIHVzZWQuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSB0aGF0IGhhcyB0ZXh0RG9jdW1lbnQgcHJvcGVydHkgd2l0aCB0aGUgZWRpdG9ycyB7VGV4dERvY3VtZW50SWRlbnRpZmllcn1cclxuICAvLyBhbmQgYSBwb3NpdGlvbiBwcm9wZXJ0eSB3aXRoIHRoZSBzdXBwbGllZCBwb2ludCAob3IgY3VycmVudCBjdXJzb3IgcG9zaXRpb24gd2hlbiBub3Qgc3BlY2lmaWVkKS5cclxuICBwdWJsaWMgc3RhdGljIGVkaXRvclRvVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMoXHJcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXHJcbiAgICBwb2ludD86IFBvaW50LFxyXG4gICk6IGxzLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRleHREb2N1bWVudDogQ29udmVydC5lZGl0b3JUb1RleHREb2N1bWVudElkZW50aWZpZXIoZWRpdG9yKSxcclxuICAgICAgcG9zaXRpb246IENvbnZlcnQucG9pbnRUb1Bvc2l0aW9uKHBvaW50ICE9IG51bGwgPyBwb2ludCA6IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENyZWF0ZSBhIHN0cmluZyBvZiBzY29wZXMgZm9yIHRoZSBhdG9tIHRleHQgZWRpdG9yIHVzaW5nIHRoZSBkYXRhLWdyYW1tYXIgc2VsZWN0b3IgZnJvbSBhblxyXG4gIC8vIHtBcnJheX0gb2YgZ3JhbW1hclNjb3BlIHN0cmluZ3MuXHJcbiAgLy9cclxuICAvLyAqIGBncmFtbWFyU2NvcGVzYCBBbiB7QXJyYXl9IG9mIGdyYW1tYXIgc2NvcGUgc3RyaW5nIHRvIGNvbnZlcnQgZnJvbS5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSBzaW5nbGUgY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgQ1NTIHNlbGVjdG9ycyB0YXJnZXR0aW5nIHRoZSBncmFtbWFycyBvZiBBdG9tIHRleHQgZWRpdG9ycy5cclxuICAvLyBlLmcuIGBbJ2MnLCAnY3BwJ11gID0+IGAnYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J2MnXSwgYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J2NwcCddYFxyXG4gIHB1YmxpYyBzdGF0aWMgZ3JhbW1hclNjb3Blc1RvVGV4dEVkaXRvclNjb3BlcyhncmFtbWFyU2NvcGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gZ3JhbW1hclNjb3Blc1xyXG4gICAgICAubWFwKChnKSA9PiBgYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9XCIke0NvbnZlcnQuZW5jb2RlSFRNTEF0dHJpYnV0ZShnLnJlcGxhY2UoL1xcLi9nLCAnICcpKX1cIl1gKVxyXG4gICAgICAuam9pbignLCAnKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogRW5jb2RlIGEgc3RyaW5nIHNvIHRoYXQgaXQgY2FuIGJlIHNhZmVseSB1c2VkIHdpdGhpbiBhIEhUTUwgYXR0cmlidXRlIC0gaS5lLiByZXBsYWNpbmcgYWxsIHF1b3RlZFxyXG4gIC8vIHZhbHVlcyB3aXRoIHRoZWlyIEhUTUwgZW50aXR5IGVuY29kZWQgdmVyc2lvbnMuICBlLmcuIGBIZWxsb1wiYCBiZWNvbWVzIGBIZWxsbyZxdW90O2BcclxuICAvL1xyXG4gIC8vICogJ3MnIEEgc3RyaW5nIHRvIGJlIGVuY29kZWQuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGEgc3RyaW5nIHRoYXQgaXMgSFRNTCBhdHRyaWJ1dGUgZW5jb2RlZCBieSByZXBsYWNpbmcgJiwgPCwgPiwgXCIgYW5kICcgd2l0aCB0aGVpciBIVE1MIGVudGl0eVxyXG4gIC8vIG5hbWVkIGVxdWl2YWxlbnRzLlxyXG4gIHB1YmxpYyBzdGF0aWMgZW5jb2RlSFRNTEF0dHJpYnV0ZShzOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgYXR0cmlidXRlTWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xyXG4gICAgICAnJic6ICcmYW1wOycsXHJcbiAgICAgICc8JzogJyZsdDsnLFxyXG4gICAgICAnPic6ICcmZ3Q7JyxcclxuICAgICAgJ1wiJzogJyZxdW90OycsXHJcbiAgICAgIFwiJ1wiOiAnJmFwb3M7JyxcclxuICAgIH07XHJcbiAgICByZXR1cm4gcy5yZXBsYWNlKC9bJjw+J1wiXS9nLCAoYykgPT4gYXR0cmlidXRlTWFwW2NdKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCBhbiBBdG9tIEZpbGUgRXZlbnQgYXMgcmVjZWl2ZWQgZnJvbSBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VGaWxlcyBhbmQgY29udmVydFxyXG4gIC8vIGl0IGludG8gYW4gQXJyYXkgb2YgTGFuZ3VhZ2UgU2VydmVyIFByb3RvY29sIHtGaWxlRXZlbnR9IG9iamVjdHMuIE5vcm1hbGx5IHRoaXMgd2lsbCBiZSBhIDEtdG8tMVxyXG4gIC8vIGJ1dCByZW5hbWVzIHdpbGwgYmUgcmVwcmVzZW50ZWQgYnkgYSBkZWxldGlvbiBhbmQgYSBzdWJzZXF1ZW50IGNyZWF0aW9uIGFzIExTUCBkb2VzIG5vdCBrbm93IGFib3V0XHJcbiAgLy8gcmVuYW1lcy5cclxuICAvL1xyXG4gIC8vICogJ2ZpbGVFdmVudCcgQW4ge2F0b20kUHJvamVjdEZpbGVFdmVudH0gdG8gYmUgY29udmVydGVkLlxyXG4gIC8vXHJcbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiBMU1Age2xzLkZpbGVFdmVudH0gb2JqZWN0cyB0aGF0IGVxdWl2YWxlbnQgY29udmVyc2lvbnMgdG8gdGhlIGZpbGVFdmVudCBwYXJhbWV0ZXIuXHJcbiAgcHVibGljIHN0YXRpYyBhdG9tRmlsZUV2ZW50VG9MU0ZpbGVFdmVudHMoZmlsZUV2ZW50OiBGaWxlc3lzdGVtQ2hhbmdlKTogbHMuRmlsZUV2ZW50W10ge1xyXG4gICAgc3dpdGNoIChmaWxlRXZlbnQuYWN0aW9uKSB7XHJcbiAgICAgIGNhc2UgJ2NyZWF0ZWQnOlxyXG4gICAgICAgIHJldHVybiBbe3VyaTogQ29udmVydC5wYXRoVG9VcmkoZmlsZUV2ZW50LnBhdGgpLCB0eXBlOiBscy5GaWxlQ2hhbmdlVHlwZS5DcmVhdGVkfV07XHJcbiAgICAgIGNhc2UgJ21vZGlmaWVkJzpcclxuICAgICAgICByZXR1cm4gW3t1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5wYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuQ2hhbmdlZH1dO1xyXG4gICAgICBjYXNlICdkZWxldGVkJzpcclxuICAgICAgICByZXR1cm4gW3t1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5wYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuRGVsZXRlZH1dO1xyXG4gICAgICBjYXNlICdyZW5hbWVkJzoge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IEFycmF5PHsgdXJpOiBzdHJpbmcsIHR5cGU6IGxzLkZpbGVDaGFuZ2VUeXBlIH0+ID0gW107XHJcbiAgICAgICAgaWYgKGZpbGVFdmVudC5vbGRQYXRoKSB7XHJcbiAgICAgICAgICByZXN1bHRzLnB1c2goe3VyaTogQ29udmVydC5wYXRoVG9VcmkoZmlsZUV2ZW50Lm9sZFBhdGgpLCB0eXBlOiBscy5GaWxlQ2hhbmdlVHlwZS5EZWxldGVkfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmaWxlRXZlbnQucGF0aCkge1xyXG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHt1cmk6IENvbnZlcnQucGF0aFRvVXJpKGZpbGVFdmVudC5wYXRoKSwgdHlwZTogbHMuRmlsZUNoYW5nZVR5cGUuQ3JlYXRlZH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgfVxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgYXRvbUlkZURpYWdub3N0aWNUb0xTRGlhZ25vc3RpYyhkaWFnbm9zdGljOiBEaWFnbm9zdGljKTogbHMuRGlhZ25vc3RpYyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByYW5nZTogQ29udmVydC5hdG9tUmFuZ2VUb0xTUmFuZ2UoZGlhZ25vc3RpYy5yYW5nZSksXHJcbiAgICAgIHNldmVyaXR5OiBDb252ZXJ0LmRpYWdub3N0aWNUeXBlVG9MU1NldmVyaXR5KGRpYWdub3N0aWMudHlwZSksXHJcbiAgICAgIHNvdXJjZTogZGlhZ25vc3RpYy5wcm92aWRlck5hbWUsXHJcbiAgICAgIG1lc3NhZ2U6IGRpYWdub3N0aWMudGV4dCB8fCAnJyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIGRpYWdub3N0aWNUeXBlVG9MU1NldmVyaXR5KHR5cGU6IERpYWdub3N0aWNUeXBlKTogbHMuRGlhZ25vc3RpY1NldmVyaXR5IHtcclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICBjYXNlICdFcnJvcic6XHJcbiAgICAgICAgcmV0dXJuIGxzLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvcjtcclxuICAgICAgY2FzZSAnV2FybmluZyc6XHJcbiAgICAgICAgcmV0dXJuIGxzLkRpYWdub3N0aWNTZXZlcml0eS5XYXJuaW5nO1xyXG4gICAgICBjYXNlICdJbmZvJzpcclxuICAgICAgICByZXR1cm4gbHMuRGlhZ25vc3RpY1NldmVyaXR5LkluZm9ybWF0aW9uO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRocm93IEVycm9yKGBVbmV4cGVjdGVkIGRpYWdub3N0aWMgdHlwZSAke3R5cGV9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gYXJyYXkgb2YgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIHtUZXh0RWRpdH0gb2JqZWN0cyB0byBhblxyXG4gIC8vIGVxdWl2YWxlbnQgYXJyYXkgb2YgQXRvbSB7VGV4dEVkaXR9IG9iamVjdHMuXHJcbiAgLy9cclxuICAvLyAqIGB0ZXh0RWRpdHNgIFRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wge1RleHRFZGl0fSBvYmplY3RzIHRvIGNvbnZlcnQuXHJcbiAgLy9cclxuICAvLyBSZXR1cm5zIGFuIHtBcnJheX0gb2YgQXRvbSB7VGV4dEVkaXR9IG9iamVjdHMuXHJcbiAgcHVibGljIHN0YXRpYyBjb252ZXJ0THNUZXh0RWRpdHModGV4dEVkaXRzOiBscy5UZXh0RWRpdFtdIHwgbnVsbCk6IFRleHRFZGl0W10ge1xyXG4gICAgcmV0dXJuICh0ZXh0RWRpdHMgfHwgW10pLm1hcChDb252ZXJ0LmNvbnZlcnRMc1RleHRFZGl0KTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB7VGV4dEVkaXR9IG9iamVjdCB0byB0aGVcclxuICAvLyBBdG9tIGVxdWl2YWxlbnQge1RleHRFZGl0fS5cclxuICAvL1xyXG4gIC8vICogYHRleHRFZGl0c2AgVGhlIGxhbmd1YWdlIHNlcnZlciBwcm90b2NvbCB7VGV4dEVkaXR9IG9iamVjdHMgdG8gY29udmVydC5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYW4gQXRvbSB7VGV4dEVkaXR9IG9iamVjdC5cclxuICBwdWJsaWMgc3RhdGljIGNvbnZlcnRMc1RleHRFZGl0KHRleHRFZGl0OiBscy5UZXh0RWRpdCk6IFRleHRFZGl0IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIG9sZFJhbmdlOiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZSh0ZXh0RWRpdC5yYW5nZSksXHJcbiAgICAgIG5ld1RleHQ6IHRleHRFZGl0Lm5ld1RleHQsXHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/download-file.js":
/*!*********************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/download-file.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __webpack_require__(/*! fs */ "fs");
// Public: Download a file and store it on a file system using streaming with appropriate progress callback.
//
// * `sourceUrl`        Url to download from.
// * `targetFile`       File path to save to.
// * `progressCallback` Callback function that will be given a {ByteProgressCallback} object containing
//                      both bytesDone and percent.
// * `length`           File length in bytes if you want percentage progress indication and the server is
//                      unable to provide a Content-Length header and whitelist CORS access via a
//                      `Access-Control-Expose-Headers "content-length"` header.
//
// Returns a {Promise} that will accept when complete.
exports.default = (function downloadFile(sourceUrl, targetFile, progressCallback, length) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = new Request(sourceUrl, {
            headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
        });
        const response = yield fetch(request);
        if (!response.ok) {
            throw Error(`Unable to download, server returned ${response.status} ${response.statusText}`);
        }
        const body = response.body;
        if (body == null) {
            throw Error('No response body');
        }
        const finalLength = length || parseInt(response.headers.get('Content-Length') || '0', 10);
        const reader = body.getReader();
        const writer = fs.createWriteStream(targetFile);
        yield streamWithProgress(finalLength, reader, writer, progressCallback);
        writer.end();
    });
});
// Stream from a {ReadableStreamReader} to a {WriteStream} with progress callback.
//
// * `length`           File length in bytes.
// * `reader`           {ReadableStreamReader} to read from.
// * `writer`           {WriteStream} to write to.
// * `progressCallback` Callback function that will be given a {ByteProgressCallback} object containing
//                      both bytesDone and percent.
//
// Returns a {Promise} that will accept when complete.
function streamWithProgress(length, reader, writer, progressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        let bytesDone = 0;
        while (true) {
            const result = yield reader.read();
            if (result.done) {
                if (progressCallback != null) {
                    progressCallback(length, 100);
                }
                return;
            }
            const chunk = result.value;
            if (chunk == null) {
                throw Error('Empty chunk received during download');
            }
            else {
                writer.write(Buffer.from(chunk));
                if (progressCallback != null) {
                    bytesDone += chunk.byteLength;
                    const percent = length === 0 ? undefined : Math.floor(bytesDone / length * 100);
                    progressCallback(bytesDone, percent);
                }
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWQtZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9kb3dubG9hZC1maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSx5QkFBeUI7QUFFekIsNEdBQTRHO0FBQzVHLEVBQUU7QUFDRiw2Q0FBNkM7QUFDN0MsNkNBQTZDO0FBQzdDLHVHQUF1RztBQUN2RyxtREFBbUQ7QUFDbkQseUdBQXlHO0FBQ3pHLGlHQUFpRztBQUNqRyxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCxrQkFBZSxDQUFDLFNBQWUsWUFBWSxDQUN6QyxTQUFpQixFQUNqQixVQUFrQixFQUNsQixnQkFBdUMsRUFDdkMsTUFBZTs7UUFFZixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDckMsT0FBTyxFQUFFLElBQUksT0FBTyxDQUFDLEVBQUMsY0FBYyxFQUFFLDBCQUEwQixFQUFDLENBQUM7U0FDbkUsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUU7WUFDaEIsTUFBTSxLQUFLLENBQUMsdUNBQXVDLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7U0FDOUY7UUFFRCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQzNCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtZQUNoQixNQUFNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMxRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWhELE1BQU0sa0JBQWtCLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDZixDQUFDO0NBQUEsQ0FBQyxDQUFDO0FBRUgsa0ZBQWtGO0FBQ2xGLEVBQUU7QUFDRiw2Q0FBNkM7QUFDN0MsNERBQTREO0FBQzVELGtEQUFrRDtBQUNsRCx1R0FBdUc7QUFDdkcsbURBQW1EO0FBQ25ELEVBQUU7QUFDRixzREFBc0Q7QUFDdEQsU0FBZSxrQkFBa0IsQ0FDL0IsTUFBYyxFQUNkLE1BQTRCLEVBQzVCLE1BQXNCLEVBQ3RCLGdCQUF1Qzs7UUFFdkMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLE9BQU8sSUFBSSxFQUFFO1lBQ1gsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkMsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUNmLElBQUksZ0JBQWdCLElBQUksSUFBSSxFQUFFO29CQUM1QixnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQy9CO2dCQUNELE9BQU87YUFDUjtZQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDM0IsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO2dCQUNqQixNQUFNLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQ3JEO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLGdCQUFnQixJQUFJLElBQUksRUFBRTtvQkFDNUIsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUM7b0JBQzlCLE1BQU0sT0FBTyxHQUF1QixNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFDcEcsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUN0QzthQUNGO1NBQ0Y7SUFDSCxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XHJcblxyXG4vLyBQdWJsaWM6IERvd25sb2FkIGEgZmlsZSBhbmQgc3RvcmUgaXQgb24gYSBmaWxlIHN5c3RlbSB1c2luZyBzdHJlYW1pbmcgd2l0aCBhcHByb3ByaWF0ZSBwcm9ncmVzcyBjYWxsYmFjay5cclxuLy9cclxuLy8gKiBgc291cmNlVXJsYCAgICAgICAgVXJsIHRvIGRvd25sb2FkIGZyb20uXHJcbi8vICogYHRhcmdldEZpbGVgICAgICAgIEZpbGUgcGF0aCB0byBzYXZlIHRvLlxyXG4vLyAqIGBwcm9ncmVzc0NhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZ2l2ZW4gYSB7Qnl0ZVByb2dyZXNzQ2FsbGJhY2t9IG9iamVjdCBjb250YWluaW5nXHJcbi8vICAgICAgICAgICAgICAgICAgICAgIGJvdGggYnl0ZXNEb25lIGFuZCBwZXJjZW50LlxyXG4vLyAqIGBsZW5ndGhgICAgICAgICAgICBGaWxlIGxlbmd0aCBpbiBieXRlcyBpZiB5b3Ugd2FudCBwZXJjZW50YWdlIHByb2dyZXNzIGluZGljYXRpb24gYW5kIHRoZSBzZXJ2ZXIgaXNcclxuLy8gICAgICAgICAgICAgICAgICAgICAgdW5hYmxlIHRvIHByb3ZpZGUgYSBDb250ZW50LUxlbmd0aCBoZWFkZXIgYW5kIHdoaXRlbGlzdCBDT1JTIGFjY2VzcyB2aWEgYVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICBgQWNjZXNzLUNvbnRyb2wtRXhwb3NlLUhlYWRlcnMgXCJjb250ZW50LWxlbmd0aFwiYCBoZWFkZXIuXHJcbi8vXHJcbi8vIFJldHVybnMgYSB7UHJvbWlzZX0gdGhhdCB3aWxsIGFjY2VwdCB3aGVuIGNvbXBsZXRlLlxyXG5leHBvcnQgZGVmYXVsdCAoYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRGaWxlKFxyXG4gIHNvdXJjZVVybDogc3RyaW5nLFxyXG4gIHRhcmdldEZpbGU6IHN0cmluZyxcclxuICBwcm9ncmVzc0NhbGxiYWNrPzogQnl0ZVByb2dyZXNzQ2FsbGJhY2ssXHJcbiAgbGVuZ3RoPzogbnVtYmVyLFxyXG4pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3Qoc291cmNlVXJsLCB7XHJcbiAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nfSksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2gocmVxdWVzdCk7XHJcbiAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgdGhyb3cgRXJyb3IoYFVuYWJsZSB0byBkb3dubG9hZCwgc2VydmVyIHJldHVybmVkICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBib2R5ID0gcmVzcG9uc2UuYm9keTtcclxuICBpZiAoYm9keSA9PSBudWxsKSB7XHJcbiAgICB0aHJvdyBFcnJvcignTm8gcmVzcG9uc2UgYm9keScpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZmluYWxMZW5ndGggPSBsZW5ndGggfHwgcGFyc2VJbnQocmVzcG9uc2UuaGVhZGVycy5nZXQoJ0NvbnRlbnQtTGVuZ3RoJykgfHwgJzAnLCAxMCk7XHJcbiAgY29uc3QgcmVhZGVyID0gYm9keS5nZXRSZWFkZXIoKTtcclxuICBjb25zdCB3cml0ZXIgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0YXJnZXRGaWxlKTtcclxuXHJcbiAgYXdhaXQgc3RyZWFtV2l0aFByb2dyZXNzKGZpbmFsTGVuZ3RoLCByZWFkZXIsIHdyaXRlciwgcHJvZ3Jlc3NDYWxsYmFjayk7XHJcbiAgd3JpdGVyLmVuZCgpO1xyXG59KTtcclxuXHJcbi8vIFN0cmVhbSBmcm9tIGEge1JlYWRhYmxlU3RyZWFtUmVhZGVyfSB0byBhIHtXcml0ZVN0cmVhbX0gd2l0aCBwcm9ncmVzcyBjYWxsYmFjay5cclxuLy9cclxuLy8gKiBgbGVuZ3RoYCAgICAgICAgICAgRmlsZSBsZW5ndGggaW4gYnl0ZXMuXHJcbi8vICogYHJlYWRlcmAgICAgICAgICAgIHtSZWFkYWJsZVN0cmVhbVJlYWRlcn0gdG8gcmVhZCBmcm9tLlxyXG4vLyAqIGB3cml0ZXJgICAgICAgICAgICB7V3JpdGVTdHJlYW19IHRvIHdyaXRlIHRvLlxyXG4vLyAqIGBwcm9ncmVzc0NhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZ2l2ZW4gYSB7Qnl0ZVByb2dyZXNzQ2FsbGJhY2t9IG9iamVjdCBjb250YWluaW5nXHJcbi8vICAgICAgICAgICAgICAgICAgICAgIGJvdGggYnl0ZXNEb25lIGFuZCBwZXJjZW50LlxyXG4vL1xyXG4vLyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgd2lsbCBhY2NlcHQgd2hlbiBjb21wbGV0ZS5cclxuYXN5bmMgZnVuY3Rpb24gc3RyZWFtV2l0aFByb2dyZXNzKFxyXG4gIGxlbmd0aDogbnVtYmVyLFxyXG4gIHJlYWRlcjogUmVhZGFibGVTdHJlYW1SZWFkZXIsXHJcbiAgd3JpdGVyOiBmcy5Xcml0ZVN0cmVhbSxcclxuICBwcm9ncmVzc0NhbGxiYWNrPzogQnl0ZVByb2dyZXNzQ2FsbGJhY2ssXHJcbik6IFByb21pc2U8dm9pZD4ge1xyXG4gIGxldCBieXRlc0RvbmUgPSAwO1xyXG5cclxuICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVhZGVyLnJlYWQoKTtcclxuICAgIGlmIChyZXN1bHQuZG9uZSkge1xyXG4gICAgICBpZiAocHJvZ3Jlc3NDYWxsYmFjayAhPSBudWxsKSB7XHJcbiAgICAgICAgcHJvZ3Jlc3NDYWxsYmFjayhsZW5ndGgsIDEwMCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNodW5rID0gcmVzdWx0LnZhbHVlO1xyXG4gICAgaWYgKGNodW5rID09IG51bGwpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoJ0VtcHR5IGNodW5rIHJlY2VpdmVkIGR1cmluZyBkb3dubG9hZCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd3JpdGVyLndyaXRlKEJ1ZmZlci5mcm9tKGNodW5rKSk7XHJcbiAgICAgIGlmIChwcm9ncmVzc0NhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICBieXRlc0RvbmUgKz0gY2h1bmsuYnl0ZUxlbmd0aDtcclxuICAgICAgICBjb25zdCBwZXJjZW50OiBudW1iZXIgfCB1bmRlZmluZWQgPSBsZW5ndGggPT09IDAgPyB1bmRlZmluZWQgOiBNYXRoLmZsb29yKGJ5dGVzRG9uZSAvIGxlbmd0aCAqIDEwMCk7XHJcbiAgICAgICAgcHJvZ3Jlc3NDYWxsYmFjayhieXRlc0RvbmUsIHBlcmNlbnQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG4vLyBQdWJsaWM6IFByb2dyZXNzIGNhbGxiYWNrIGZ1bmN0aW9uIHNpZ25hdHVyZSBpbmRpY2F0aW5nIHRoZSBieXRlc0RvbmUgYW5kXHJcbi8vIG9wdGlvbmFsIHBlcmNlbnRhZ2Ugd2hlbiBsZW5ndGggaXMga25vd24uXHJcbmV4cG9ydCB0eXBlIEJ5dGVQcm9ncmVzc0NhbGxiYWNrID0gKGJ5dGVzRG9uZTogbnVtYmVyLCBwZXJjZW50PzogbnVtYmVyKSA9PiB2b2lkO1xyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/languageclient.js":
/*!**********************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/languageclient.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const jsonrpc = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/vscode-jsonrpc/lib/main.js");
const events_1 = __webpack_require__(/*! events */ "events");
const logger_1 = __webpack_require__(/*! ./logger */ "./node_modules/atom-languageclient/build/lib/logger.js");
__export(__webpack_require__(/*! vscode-languageserver-protocol */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/main.js"));
// TypeScript wrapper around JSONRPC to implement Microsoft Language Server Protocol v3
// https://github.com/Microsoft/language-server-protocol/blob/master/protocol.md
class LanguageClientConnection extends events_1.EventEmitter {
    constructor(rpc, logger) {
        super();
        this._rpc = rpc;
        this._log = logger || new logger_1.NullLogger();
        this.setupLogging();
        rpc.listen();
        this.isConnected = true;
        this._rpc.onClose(() => {
            this.isConnected = false;
            this._log.warn('rpc.onClose', 'The RPC connection closed unexpectedly');
            this.emit('close');
        });
    }
    setupLogging() {
        this._rpc.onError((error) => this._log.error(['rpc.onError', error]));
        this._rpc.onUnhandledNotification((notification) => {
            if (notification.method != null && notification.params != null) {
                this._log.warn(`rpc.onUnhandledNotification ${notification.method}`, notification.params);
            }
            else {
                this._log.warn('rpc.onUnhandledNotification', notification);
            }
        });
        this._rpc.onNotification((...args) => this._log.debug('rpc.onNotification', args));
    }
    dispose() {
        this._rpc.dispose();
    }
    // Public: Initialize the language server with necessary {InitializeParams}.
    //
    // * `params` The {InitializeParams} containing processId, rootPath, options and
    //            server capabilities.
    //
    // Returns a {Promise} containing the {InitializeResult} with details of the server's
    // capabilities.
    initialize(params) {
        return this._sendRequest('initialize', params);
    }
    // Public: Send an `initialized` notification to the language server.
    initialized() {
        this._sendNotification('initialized', {});
    }
    // Public: Send a `shutdown` request to the language server.
    shutdown() {
        return this._sendRequest('shutdown');
    }
    // Public: Send an `exit` notification to the language server.
    exit() {
        this._sendNotification('exit');
    }
    // Public: Register a callback for a custom message.
    //
    // * `method`   A string containing the name of the message to listen for.
    // * `callback` The function to be called when the message is received.
    //              The payload from the message is passed to the function.
    onCustom(method, callback) {
        this._onNotification({ method }, callback);
    }
    // Public: Send a custom request
    //
    // * `method`   A string containing the name of the request message.
    // * `params`   The method's parameters
    sendCustomRequest(method, params) {
        return this._sendRequest(method, params);
    }
    // Public: Send a custom notification
    //
    // * `method`   A string containing the name of the notification message.
    // * `params`  The method's parameters
    sendCustomNotification(method, params) {
        this._sendNotification(method, params);
    }
    // Public: Register a callback for the `window/showMessage` message.
    //
    // * `callback` The function to be called when the `window/showMessage` message is
    //              received with {ShowMessageParams} being passed.
    onShowMessage(callback) {
        this._onNotification({ method: 'window/showMessage' }, callback);
    }
    // Public: Register a callback for the `window/showMessageRequest` message.
    //
    // * `callback` The function to be called when the `window/showMessageRequest` message is
    //              received with {ShowMessageRequestParam}' being passed.
    // Returns a {Promise} containing the {MessageActionItem}.
    onShowMessageRequest(callback) {
        this._onRequest({ method: 'window/showMessageRequest' }, callback);
    }
    // Public: Register a callback for the `window/logMessage` message.
    //
    // * `callback` The function to be called when the `window/logMessage` message is
    //              received with {LogMessageParams} being passed.
    onLogMessage(callback) {
        this._onNotification({ method: 'window/logMessage' }, callback);
    }
    // Public: Register a callback for the `telemetry/event` message.
    //
    // * `callback` The function to be called when the `telemetry/event` message is
    //              received with any parameters received being passed on.
    onTelemetryEvent(callback) {
        this._onNotification({ method: 'telemetry/event' }, callback);
    }
    // Public: Register a callback for the `workspace/applyEdit` message.
    //
    // * `callback` The function to be called when the `workspace/applyEdit` message is
    //              received with {ApplyWorkspaceEditParams} being passed.
    // Returns a {Promise} containing the {ApplyWorkspaceEditResponse}.
    onApplyEdit(callback) {
        this._onRequest({ method: 'workspace/applyEdit' }, callback);
    }
    // Public: Send a `workspace/didChangeConfiguration` notification.
    //
    // * `params` The {DidChangeConfigurationParams} containing the new configuration.
    didChangeConfiguration(params) {
        this._sendNotification('workspace/didChangeConfiguration', params);
    }
    // Public: Send a `textDocument/didOpen` notification.
    //
    // * `params` The {DidOpenTextDocumentParams} containing the opened text document details.
    didOpenTextDocument(params) {
        this._sendNotification('textDocument/didOpen', params);
    }
    // Public: Send a `textDocument/didChange` notification.
    //
    // * `params` The {DidChangeTextDocumentParams} containing the changed text document
    // details including the version number and actual text changes.
    didChangeTextDocument(params) {
        this._sendNotification('textDocument/didChange', params);
    }
    // Public: Send a `textDocument/didClose` notification.
    //
    // * `params` The {DidCloseTextDocumentParams} containing the opened text document details.
    didCloseTextDocument(params) {
        this._sendNotification('textDocument/didClose', params);
    }
    // Public: Send a `textDocument/willSave` notification.
    //
    // * `params` The {WillSaveTextDocumentParams} containing the to-be-saved text document
    // details and the reason for the save.
    willSaveTextDocument(params) {
        this._sendNotification('textDocument/willSave', params);
    }
    // Public: Send a `textDocument/willSaveWaitUntil` notification.
    //
    // * `params` The {WillSaveTextDocumentParams} containing the to-be-saved text document
    // details and the reason for the save.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the text
    // document before it is saved.
    willSaveWaitUntilTextDocument(params) {
        return this._sendRequest('textDocument/willSaveWaitUntil', params);
    }
    // Public: Send a `textDocument/didSave` notification.
    //
    // * `params` The {DidSaveTextDocumentParams} containing the saved text document details.
    didSaveTextDocument(params) {
        this._sendNotification('textDocument/didSave', params);
    }
    // Public: Send a `workspace/didChangeWatchedFiles` notification.
    //
    // * `params` The {DidChangeWatchedFilesParams} containing the array of {FileEvent}s that
    // have been observed upon the watched files.
    didChangeWatchedFiles(params) {
        this._sendNotification('workspace/didChangeWatchedFiles', params);
    }
    // Public: Register a callback for the `textDocument/publishDiagnostics` message.
    //
    // * `callback` The function to be called when the `textDocument/publishDiagnostics` message is
    //              received a {PublishDiagnosticsParams} containing new {Diagnostic} messages for a given uri.
    onPublishDiagnostics(callback) {
        this._onNotification({ method: 'textDocument/publishDiagnostics' }, callback);
    }
    // Public: Send a `textDocument/completion` request.
    //
    // * `params`            The {TextDocumentPositionParams} or {CompletionParams} for which
    //                       {CompletionItem}s are desired.
    // * `cancellationToken` The {CancellationToken} that is used to cancel this request if
    //                       necessary.
    // Returns a {Promise} containing either a {CompletionList} or an {Array} of {CompletionItem}s.
    completion(params, cancellationToken) {
        // Cancel prior request if necessary
        return this._sendRequest('textDocument/completion', params, cancellationToken);
    }
    // Public: Send a `completionItem/resolve` request.
    //
    // * `params` The {CompletionItem} for which a fully resolved {CompletionItem} is desired.
    // Returns a {Promise} containing a fully resolved {CompletionItem}.
    completionItemResolve(params) {
        return this._sendRequest('completionItem/resolve', params);
    }
    // Public: Send a `textDocument/hover` request.
    //
    // * `params` The {TextDocumentPositionParams} for which a {Hover} is desired.
    // Returns a {Promise} containing a {Hover}.
    hover(params) {
        return this._sendRequest('textDocument/hover', params);
    }
    // Public: Send a `textDocument/signatureHelp` request.
    //
    // * `params` The {TextDocumentPositionParams} for which a {SignatureHelp} is desired.
    // Returns a {Promise} containing a {SignatureHelp}.
    signatureHelp(params) {
        return this._sendRequest('textDocument/signatureHelp', params);
    }
    // Public: Send a `textDocument/definition` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which one or more {Location}s
    // that define that symbol are required.
    // Returns a {Promise} containing either a single {Location} or an {Array} of many {Location}s.
    gotoDefinition(params) {
        return this._sendRequest('textDocument/definition', params);
    }
    // Public: Send a `textDocument/references` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which all referring {Location}s
    // are desired.
    // Returns a {Promise} containing an {Array} of {Location}s that reference this symbol.
    findReferences(params) {
        return this._sendRequest('textDocument/references', params);
    }
    // Public: Send a `textDocument/documentHighlight` request.
    //
    // * `params` The {TextDocumentPositionParams} of a symbol for which all highlights are desired.
    // Returns a {Promise} containing an {Array} of {DocumentHighlight}s that can be used to
    // highlight this symbol.
    documentHighlight(params) {
        return this._sendRequest('textDocument/documentHighlight', params);
    }
    // Public: Send a `textDocument/documentSymbol` request.
    //
    // * `params`            The {DocumentSymbolParams} that identifies the document for which
    //                       symbols are desired.
    // * `cancellationToken` The {CancellationToken} that is used to cancel this request if
    //                       necessary.
    // Returns a {Promise} containing an {Array} of {SymbolInformation}s that can be used to
    // navigate this document.
    documentSymbol(params, cancellationToken) {
        return this._sendRequest('textDocument/documentSymbol', params);
    }
    // Public: Send a `workspace/symbol` request.
    //
    // * `params` The {WorkspaceSymbolParams} containing the query string to search the workspace for.
    // Returns a {Promise} containing an {Array} of {SymbolInformation}s that identify where the query
    // string occurs within the workspace.
    workspaceSymbol(params) {
        return this._sendRequest('workspace/symbol', params);
    }
    // Public: Send a `textDocument/codeAction` request.
    //
    // * `params` The {CodeActionParams} identifying the document, range and context for the code action.
    // Returns a {Promise} containing an {Array} of {Commands}s that can be performed against the given
    // documents range.
    codeAction(params) {
        return this._sendRequest('textDocument/codeAction', params);
    }
    // Public: Send a `textDocument/codeLens` request.
    //
    // * `params` The {CodeLensParams} identifying the document for which code lens commands are desired.
    // Returns a {Promise} containing an {Array} of {CodeLens}s that associate commands and data with
    // specified ranges within the document.
    codeLens(params) {
        return this._sendRequest('textDocument/codeLens', params);
    }
    // Public: Send a `codeLens/resolve` request.
    //
    // * `params` The {CodeLens} identifying the code lens to be resolved with full detail.
    // Returns a {Promise} containing the {CodeLens} fully resolved.
    codeLensResolve(params) {
        return this._sendRequest('codeLens/resolve', params);
    }
    // Public: Send a `textDocument/documentLink` request.
    //
    // * `params` The {DocumentLinkParams} identifying the document for which links should be identified.
    // Returns a {Promise} containing an {Array} of {DocumentLink}s relating uri's to specific ranges
    // within the document.
    documentLink(params) {
        return this._sendRequest('textDocument/documentLink', params);
    }
    // Public: Send a `documentLink/resolve` request.
    //
    // * `params` The {DocumentLink} identifying the document link to be resolved with full detail.
    // Returns a {Promise} containing the {DocumentLink} fully resolved.
    documentLinkResolve(params) {
        return this._sendRequest('documentLink/resolve', params);
    }
    // Public: Send a `textDocument/formatting` request.
    //
    // * `params` The {DocumentFormattingParams} identifying the document to be formatted as well as
    // additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentFormatting(params) {
        return this._sendRequest('textDocument/formatting', params);
    }
    // Public: Send a `textDocument/rangeFormatting` request.
    //
    // * `params` The {DocumentRangeFormattingParams} identifying the document and range to be formatted
    // as well as additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentRangeFormatting(params) {
        return this._sendRequest('textDocument/rangeFormatting', params);
    }
    // Public: Send a `textDocument/onTypeFormatting` request.
    //
    // * `params` The {DocumentOnTypeFormattingParams} identifying the document to be formatted,
    // the character that was typed and at what position as well as additional formatting preferences.
    // Returns a {Promise} containing an {Array} of {TextEdit}s to be applied to the document to
    // correctly reformat it.
    documentOnTypeFormatting(params) {
        return this._sendRequest('textDocument/onTypeFormatting', params);
    }
    // Public: Send a `textDocument/rename` request.
    //
    // * `params` The {RenameParams} identifying the document containing the symbol to be renamed,
    // as well as the position and new name.
    // Returns a {Promise} containing an {WorkspaceEdit} that contains a list of {TextEdit}s either
    // on the changes property (keyed by uri) or the documentChanges property containing
    // an {Array} of {TextDocumentEdit}s (preferred).
    rename(params) {
        return this._sendRequest('textDocument/rename', params);
    }
    // Public: Send a `workspace/executeCommand` request.
    //
    // * `params` The {ExecuteCommandParams} specifying the command and arguments
    // the language server should execute (these commands are usually from {CodeLens} or {CodeAction}
    // responses).
    // Returns a {Promise} containing anything.
    executeCommand(params) {
        return this._sendRequest('workspace/executeCommand', params);
    }
    _onRequest(type, callback) {
        this._rpc.onRequest(type.method, (value) => {
            this._log.debug(`rpc.onRequest ${type.method}`, value);
            return callback(value);
        });
    }
    _onNotification(type, callback) {
        this._rpc.onNotification(type.method, (value) => {
            this._log.debug(`rpc.onNotification ${type.method}`, value);
            callback(value);
        });
    }
    _sendNotification(method, args) {
        this._log.debug(`rpc.sendNotification ${method}`, args);
        this._rpc.sendNotification(method, args);
    }
    _sendRequest(method, args, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            this._log.debug(`rpc.sendRequest ${method} sending`, args);
            try {
                const start = performance.now();
                let result;
                if (cancellationToken) {
                    result = yield this._rpc.sendRequest(method, args, cancellationToken);
                }
                else {
                    // If cancellationToken is null or undefined, don't add the third
                    // argument otherwise vscode-jsonrpc will send an additional, null
                    // message parameter to the request
                    result = yield this._rpc.sendRequest(method, args);
                }
                const took = performance.now() - start;
                this._log.debug(`rpc.sendRequest ${method} received (${Math.floor(took)}ms)`, result);
                return result;
            }
            catch (e) {
                const responseError = e;
                if (cancellationToken && responseError.code === jsonrpc.ErrorCodes.RequestCancelled) {
                    this._log.debug(`rpc.sendRequest ${method} was cancelled`);
                }
                else {
                    this._log.error(`rpc.sendRequest ${method} threw`, e);
                }
                throw e;
            }
        });
    }
}
exports.LanguageClientConnection = LanguageClientConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VjbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvbGFuZ3VhZ2VjbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUEwQztBQUUxQyxtQ0FBc0M7QUFDdEMscUNBR2tCO0FBRWxCLG9EQUErQztBQXVCL0MsdUZBQXVGO0FBQ3ZGLGdGQUFnRjtBQUNoRixNQUFhLHdCQUF5QixTQUFRLHFCQUFZO0lBS3hELFlBQVksR0FBOEIsRUFBRSxNQUFlO1FBQ3pELEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksSUFBSSxtQkFBVSxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUViLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsd0NBQXdDLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLFlBQVk7UUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7WUFDakQs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anNvbnJwYyBmcm9tICd2c2NvZGUtanNvbnJwYyc7XHJcbmltcG9ydCAqIGFzIGxzcCBmcm9tICd2c2NvZGUtbGFuZ3VhZ2VzZXJ2ZXItcHJvdG9jb2wnO1xyXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xyXG5pbXBvcnQge1xyXG4gIE51bGxMb2dnZXIsXHJcbiAgTG9nZ2VyLFxyXG59IGZyb20gJy4vbG9nZ2VyJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ3ZzY29kZS1sYW5ndWFnZXNlcnZlci1wcm90b2NvbCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEtub3duTm90aWZpY2F0aW9ucyB7XHJcbiAgJ3RleHREb2N1bWVudC9wdWJsaXNoRGlhZ25vc3RpY3MnOiBsc3AuUHVibGlzaERpYWdub3N0aWNzUGFyYW1zO1xyXG4gICd0ZWxlbWV0cnkvZXZlbnQnOiBhbnk7XHJcbiAgJ3dpbmRvdy9sb2dNZXNzYWdlJzogbHNwLkxvZ01lc3NhZ2VQYXJhbXM7XHJcbiAgJ3dpbmRvdy9zaG93TWVzc2FnZVJlcXVlc3QnOiBsc3AuU2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zO1xyXG4gICd3aW5kb3cvc2hvd01lc3NhZ2UnOiBsc3AuU2hvd01lc3NhZ2VQYXJhbXM7XHJcbiAgW2N1c3RvbTogc3RyaW5nXTogb2JqZWN0O1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEtub3duUmVxdWVzdHMge1xyXG4gICd3aW5kb3cvc2hvd01lc3NhZ2VSZXF1ZXN0JzpcclxuICAgIFtsc3AuU2hvd01lc3NhZ2VSZXF1ZXN0UGFyYW1zLCBsc3AuTWVzc2FnZUFjdGlvbkl0ZW0gfCBudWxsXTtcclxuICAnd29ya3NwYWNlL2FwcGx5RWRpdCc6XHJcbiAgICBbbHNwLkFwcGx5V29ya3NwYWNlRWRpdFBhcmFtcywgbHNwLkFwcGx5V29ya3NwYWNlRWRpdFJlc3BvbnNlXTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgUmVxdWVzdENhbGxiYWNrPFQgZXh0ZW5kcyBrZXlvZiBLbm93blJlcXVlc3RzPiA9XHJcbiAgS25vd25SZXF1ZXN0c1tUXSBleHRlbmRzIFtpbmZlciBVLCBpbmZlciBWXSA/XHJcbiAgKHBhcmFtOiBVKSA9PiBQcm9taXNlPFY+IDpcclxuICBuZXZlcjtcclxuXHJcbi8vIFR5cGVTY3JpcHQgd3JhcHBlciBhcm91bmQgSlNPTlJQQyB0byBpbXBsZW1lbnQgTWljcm9zb2Z0IExhbmd1YWdlIFNlcnZlciBQcm90b2NvbCB2M1xyXG4vLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L2xhbmd1YWdlLXNlcnZlci1wcm90b2NvbC9ibG9iL21hc3Rlci9wcm90b2NvbC5tZFxyXG5leHBvcnQgY2xhc3MgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuICBwcml2YXRlIF9ycGM6IGpzb25ycGMuTWVzc2FnZUNvbm5lY3Rpb247XHJcbiAgcHJpdmF0ZSBfbG9nOiBMb2dnZXI7XHJcbiAgcHVibGljIGlzQ29ubmVjdGVkOiBib29sZWFuO1xyXG5cclxuICBjb25zdHJ1Y3RvcihycGM6IGpzb25ycGMuTWVzc2FnZUNvbm5lY3Rpb24sIGxvZ2dlcj86IExvZ2dlcikge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuX3JwYyA9IHJwYztcclxuICAgIHRoaXMuX2xvZyA9IGxvZ2dlciB8fCBuZXcgTnVsbExvZ2dlcigpO1xyXG4gICAgdGhpcy5zZXR1cExvZ2dpbmcoKTtcclxuICAgIHJwYy5saXN0ZW4oKTtcclxuXHJcbiAgICB0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZTtcclxuICAgIHRoaXMuX3JwYy5vbkNsb3NlKCgpID0+IHtcclxuICAgICAgdGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9sb2cud2FybigncnBjLm9uQ2xvc2UnLCAnVGhlIFJQQyBjb25uZWN0aW9uIGNsb3NlZCB1bmV4cGVjdGVkbHknKTtcclxuICAgICAgdGhpcy5lbWl0KCdjbG9zZScpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldHVwTG9nZ2luZygpOiB2b2lkIHtcclxuICAgIHRoaXMuX3JwYy5vbkVycm9yKChlcnJvcikgPT4gdGhpcy5fbG9nLmVycm9yKFsncnBjLm9uRXJyb3InLCBlcnJvcl0pKTtcclxuICAgIHRoaXMuX3JwYy5vblVuaGFuZGxlZE5vdGlmaWNhdGlvbigobm90aWZpY2F0aW9uKSA9PiB7XHJcbiAgICAgIGlmIChub3RpZmljYXRpb24ubWV0aG9kICE9IG51bGwgJiYgbm90aWZpY2F0aW9uLnBhcmFtcyAhPSBudWxsKSB7XHJcbiAgICAgICAgdGhpcy5fbG9nLndhcm4oYHJwYy5vblVuaGFuZGxlZE5vdGlmaWNhdGlvbiAke25vdGlmaWNhdGlvbi5tZXRob2R9YCwgbm90aWZpY2F0aW9uLnBhcmFtcyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5fbG9nLndhcm4oJ3JwYy5vblVuaGFuZGxlZE5vdGlmaWNhdGlvbicsIG5vdGlmaWNhdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgdGhpcy5fcnBjLm9uTm90aWZpY2F0aW9uKCguLi5hcmdzOiBhbnlbXSkgPT4gdGhpcy5fbG9nLmRlYnVnKCdycGMub25Ob3RpZmljYXRpb24nLCBhcmdzKSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZGlzcG9zZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuX3JwYy5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IEluaXRpYWxpemUgdGhlIGxhbmd1YWdlIHNlcnZlciB3aXRoIG5lY2Vzc2FyeSB7SW5pdGlhbGl6ZVBhcmFtc30uXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7SW5pdGlhbGl6ZVBhcmFtc30gY29udGFpbmluZyBwcm9jZXNzSWQsIHJvb3RQYXRoLCBvcHRpb25zIGFuZFxyXG4gIC8vICAgICAgICAgICAgc2VydmVyIGNhcGFiaWxpdGllcy5cclxuICAvL1xyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0luaXRpYWxpemVSZXN1bHR9IHdpdGggZGV0YWlscyBvZiB0aGUgc2VydmVyJ3NcclxuICAvLyBjYXBhYmlsaXRpZXMuXHJcbiAgcHVibGljIGluaXRpYWxpemUocGFyYW1zOiBsc3AuSW5pdGlhbGl6ZVBhcmFtcyk6IFByb21pc2U8bHNwLkluaXRpYWxpemVSZXN1bHQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnaW5pdGlhbGl6ZScsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYW4gYGluaXRpYWxpemVkYCBub3RpZmljYXRpb24gdG8gdGhlIGxhbmd1YWdlIHNlcnZlci5cclxuICBwdWJsaWMgaW5pdGlhbGl6ZWQoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCdpbml0aWFsaXplZCcsIHt9KTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGBzaHV0ZG93bmAgcmVxdWVzdCB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxyXG4gIHB1YmxpYyBzaHV0ZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnc2h1dGRvd24nKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhbiBgZXhpdGAgbm90aWZpY2F0aW9uIHRvIHRoZSBsYW5ndWFnZSBzZXJ2ZXIuXHJcbiAgcHVibGljIGV4aXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCdleGl0Jyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIGEgY3VzdG9tIG1lc3NhZ2UuXHJcbiAgLy9cclxuICAvLyAqIGBtZXRob2RgICAgQSBzdHJpbmcgY29udGFpbmluZyB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSB0byBsaXN0ZW4gZm9yLlxyXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIG1lc3NhZ2UgaXMgcmVjZWl2ZWQuXHJcbiAgLy8gICAgICAgICAgICAgIFRoZSBwYXlsb2FkIGZyb20gdGhlIG1lc3NhZ2UgaXMgcGFzc2VkIHRvIHRoZSBmdW5jdGlvbi5cclxuICBwdWJsaWMgb25DdXN0b20obWV0aG9kOiBzdHJpbmcsIGNhbGxiYWNrOiAob2JqOiBvYmplY3QpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHttZXRob2R9LCBjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBjdXN0b20gcmVxdWVzdFxyXG4gIC8vXHJcbiAgLy8gKiBgbWV0aG9kYCAgIEEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIG5hbWUgb2YgdGhlIHJlcXVlc3QgbWVzc2FnZS5cclxuICAvLyAqIGBwYXJhbXNgICAgVGhlIG1ldGhvZCdzIHBhcmFtZXRlcnNcclxuICBwdWJsaWMgc2VuZEN1c3RvbVJlcXVlc3QobWV0aG9kOiBzdHJpbmcsIHBhcmFtcz86IGFueVtdIHwgb2JqZWN0KTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QobWV0aG9kLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgY3VzdG9tIG5vdGlmaWNhdGlvblxyXG4gIC8vXHJcbiAgLy8gKiBgbWV0aG9kYCAgIEEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIG5hbWUgb2YgdGhlIG5vdGlmaWNhdGlvbiBtZXNzYWdlLlxyXG4gIC8vICogYHBhcmFtc2AgIFRoZSBtZXRob2QncyBwYXJhbWV0ZXJzXHJcbiAgcHVibGljIHNlbmRDdXN0b21Ob3RpZmljYXRpb24obWV0aG9kOiBzdHJpbmcsIHBhcmFtcz86IGFueVtdIHwgb2JqZWN0KTogdm9pZCB7XHJcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKG1ldGhvZCwgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB3aW5kb3cvc2hvd01lc3NhZ2VgIG1lc3NhZ2UuXHJcbiAgLy9cclxuICAvLyAqIGBjYWxsYmFja2AgVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlYCBtZXNzYWdlIGlzXHJcbiAgLy8gICAgICAgICAgICAgIHJlY2VpdmVkIHdpdGgge1Nob3dNZXNzYWdlUGFyYW1zfSBiZWluZyBwYXNzZWQuXHJcbiAgcHVibGljIG9uU2hvd01lc3NhZ2UoY2FsbGJhY2s6IChwYXJhbXM6IGxzcC5TaG93TWVzc2FnZVBhcmFtcykgPT4gdm9pZCk6IHZvaWQge1xyXG4gICAgdGhpcy5fb25Ob3RpZmljYXRpb24oe21ldGhvZDogJ3dpbmRvdy9zaG93TWVzc2FnZSd9LCBjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgd2luZG93L3Nob3dNZXNzYWdlUmVxdWVzdGAgbWVzc2FnZS5cclxuICAvL1xyXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB3aW5kb3cvc2hvd01lc3NhZ2VSZXF1ZXN0YCBtZXNzYWdlIGlzXHJcbiAgLy8gICAgICAgICAgICAgIHJlY2VpdmVkIHdpdGgge1Nob3dNZXNzYWdlUmVxdWVzdFBhcmFtfScgYmVpbmcgcGFzc2VkLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge01lc3NhZ2VBY3Rpb25JdGVtfS5cclxuICBwdWJsaWMgb25TaG93TWVzc2FnZVJlcXVlc3QoY2FsbGJhY2s6IChwYXJhbXM6IGxzcC5TaG93TWVzc2FnZVJlcXVlc3RQYXJhbXMpXHJcbiAgPT4gUHJvbWlzZTxsc3AuTWVzc2FnZUFjdGlvbkl0ZW0gfCBudWxsPik6IHZvaWQge1xyXG4gICAgdGhpcy5fb25SZXF1ZXN0KHttZXRob2Q6ICd3aW5kb3cvc2hvd01lc3NhZ2VSZXF1ZXN0J30sIGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB3aW5kb3cvbG9nTWVzc2FnZWAgbWVzc2FnZS5cclxuICAvL1xyXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB3aW5kb3cvbG9nTWVzc2FnZWAgbWVzc2FnZSBpc1xyXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCB3aXRoIHtMb2dNZXNzYWdlUGFyYW1zfSBiZWluZyBwYXNzZWQuXHJcbiAgcHVibGljIG9uTG9nTWVzc2FnZShjYWxsYmFjazogKHBhcmFtczogbHNwLkxvZ01lc3NhZ2VQYXJhbXMpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHttZXRob2Q6ICd3aW5kb3cvbG9nTWVzc2FnZSd9LCBjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgdGVsZW1ldHJ5L2V2ZW50YCBtZXNzYWdlLlxyXG4gIC8vXHJcbiAgLy8gKiBgY2FsbGJhY2tgIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgYHRlbGVtZXRyeS9ldmVudGAgbWVzc2FnZSBpc1xyXG4gIC8vICAgICAgICAgICAgICByZWNlaXZlZCB3aXRoIGFueSBwYXJhbWV0ZXJzIHJlY2VpdmVkIGJlaW5nIHBhc3NlZCBvbi5cclxuICBwdWJsaWMgb25UZWxlbWV0cnlFdmVudChjYWxsYmFjazogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKTogdm9pZCB7XHJcbiAgICB0aGlzLl9vbk5vdGlmaWNhdGlvbih7bWV0aG9kOiAndGVsZW1ldHJ5L2V2ZW50J30sIGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogUmVnaXN0ZXIgYSBjYWxsYmFjayBmb3IgdGhlIGB3b3Jrc3BhY2UvYXBwbHlFZGl0YCBtZXNzYWdlLlxyXG4gIC8vXHJcbiAgLy8gKiBgY2FsbGJhY2tgIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgYHdvcmtzcGFjZS9hcHBseUVkaXRgIG1lc3NhZ2UgaXNcclxuICAvLyAgICAgICAgICAgICAgcmVjZWl2ZWQgd2l0aCB7QXBwbHlXb3Jrc3BhY2VFZGl0UGFyYW1zfSBiZWluZyBwYXNzZWQuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIHRoZSB7QXBwbHlXb3Jrc3BhY2VFZGl0UmVzcG9uc2V9LlxyXG4gIHB1YmxpYyBvbkFwcGx5RWRpdChjYWxsYmFjazogKHBhcmFtczogbHNwLkFwcGx5V29ya3NwYWNlRWRpdFBhcmFtcykgPT5cclxuICBQcm9taXNlPGxzcC5BcHBseVdvcmtzcGFjZUVkaXRSZXNwb25zZT4pOiB2b2lkIHtcclxuICAgIHRoaXMuX29uUmVxdWVzdCh7bWV0aG9kOiAnd29ya3NwYWNlL2FwcGx5RWRpdCd9LCBjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgd29ya3NwYWNlL2RpZENoYW5nZUNvbmZpZ3VyYXRpb25gIG5vdGlmaWNhdGlvbi5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEaWRDaGFuZ2VDb25maWd1cmF0aW9uUGFyYW1zfSBjb250YWluaW5nIHRoZSBuZXcgY29uZmlndXJhdGlvbi5cclxuICBwdWJsaWMgZGlkQ2hhbmdlQ29uZmlndXJhdGlvbihwYXJhbXM6IGxzcC5EaWRDaGFuZ2VDb25maWd1cmF0aW9uUGFyYW1zKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd3b3Jrc3BhY2UvZGlkQ2hhbmdlQ29uZmlndXJhdGlvbicsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RpZE9wZW5gIG5vdGlmaWNhdGlvbi5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEaWRPcGVuVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBvcGVuZWQgdGV4dCBkb2N1bWVudCBkZXRhaWxzLlxyXG4gIHB1YmxpYyBkaWRPcGVuVGV4dERvY3VtZW50KHBhcmFtczogbHNwLkRpZE9wZW5UZXh0RG9jdW1lbnRQYXJhbXMpOiB2b2lkIHtcclxuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3RleHREb2N1bWVudC9kaWRPcGVuJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZGlkQ2hhbmdlYCBub3RpZmljYXRpb24uXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7RGlkQ2hhbmdlVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBjaGFuZ2VkIHRleHQgZG9jdW1lbnRcclxuICAvLyBkZXRhaWxzIGluY2x1ZGluZyB0aGUgdmVyc2lvbiBudW1iZXIgYW5kIGFjdHVhbCB0ZXh0IGNoYW5nZXMuXHJcbiAgcHVibGljIGRpZENoYW5nZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5EaWRDaGFuZ2VUZXh0RG9jdW1lbnRQYXJhbXMpOiB2b2lkIHtcclxuICAgIHRoaXMuX3NlbmROb3RpZmljYXRpb24oJ3RleHREb2N1bWVudC9kaWRDaGFuZ2UnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kaWRDbG9zZWAgbm90aWZpY2F0aW9uLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZENsb3NlVGV4dERvY3VtZW50UGFyYW1zfSBjb250YWluaW5nIHRoZSBvcGVuZWQgdGV4dCBkb2N1bWVudCBkZXRhaWxzLlxyXG4gIHB1YmxpYyBkaWRDbG9zZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5EaWRDbG9zZVRleHREb2N1bWVudFBhcmFtcyk6IHZvaWQge1xyXG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbigndGV4dERvY3VtZW50L2RpZENsb3NlJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvd2lsbFNhdmVgIG5vdGlmaWNhdGlvbi5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtXaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtc30gY29udGFpbmluZyB0aGUgdG8tYmUtc2F2ZWQgdGV4dCBkb2N1bWVudFxyXG4gIC8vIGRldGFpbHMgYW5kIHRoZSByZWFzb24gZm9yIHRoZSBzYXZlLlxyXG4gIHB1YmxpYyB3aWxsU2F2ZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5XaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtcyk6IHZvaWQge1xyXG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbigndGV4dERvY3VtZW50L3dpbGxTYXZlJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvd2lsbFNhdmVXYWl0VW50aWxgIG5vdGlmaWNhdGlvbi5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtXaWxsU2F2ZVRleHREb2N1bWVudFBhcmFtc30gY29udGFpbmluZyB0aGUgdG8tYmUtc2F2ZWQgdGV4dCBkb2N1bWVudFxyXG4gIC8vIGRldGFpbHMgYW5kIHRoZSByZWFzb24gZm9yIHRoZSBzYXZlLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtUZXh0RWRpdH1zIHRvIGJlIGFwcGxpZWQgdG8gdGhlIHRleHRcclxuICAvLyBkb2N1bWVudCBiZWZvcmUgaXQgaXMgc2F2ZWQuXHJcbiAgcHVibGljIHdpbGxTYXZlV2FpdFVudGlsVGV4dERvY3VtZW50KHBhcmFtczogbHNwLldpbGxTYXZlVGV4dERvY3VtZW50UGFyYW1zKTogUHJvbWlzZTxsc3AuVGV4dEVkaXRbXSB8IG51bGw+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L3dpbGxTYXZlV2FpdFVudGlsJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZGlkU2F2ZWAgbm90aWZpY2F0aW9uLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZFNhdmVUZXh0RG9jdW1lbnRQYXJhbXN9IGNvbnRhaW5pbmcgdGhlIHNhdmVkIHRleHQgZG9jdW1lbnQgZGV0YWlscy5cclxuICBwdWJsaWMgZGlkU2F2ZVRleHREb2N1bWVudChwYXJhbXM6IGxzcC5EaWRTYXZlVGV4dERvY3VtZW50UGFyYW1zKTogdm9pZCB7XHJcbiAgICB0aGlzLl9zZW5kTm90aWZpY2F0aW9uKCd0ZXh0RG9jdW1lbnQvZGlkU2F2ZScsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgd29ya3NwYWNlL2RpZENoYW5nZVdhdGNoZWRGaWxlc2Agbm90aWZpY2F0aW9uLlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge0RpZENoYW5nZVdhdGNoZWRGaWxlc1BhcmFtc30gY29udGFpbmluZyB0aGUgYXJyYXkgb2Yge0ZpbGVFdmVudH1zIHRoYXRcclxuICAvLyBoYXZlIGJlZW4gb2JzZXJ2ZWQgdXBvbiB0aGUgd2F0Y2hlZCBmaWxlcy5cclxuICBwdWJsaWMgZGlkQ2hhbmdlV2F0Y2hlZEZpbGVzKHBhcmFtczogbHNwLkRpZENoYW5nZVdhdGNoZWRGaWxlc1BhcmFtcyk6IHZvaWQge1xyXG4gICAgdGhpcy5fc2VuZE5vdGlmaWNhdGlvbignd29ya3NwYWNlL2RpZENoYW5nZVdhdGNoZWRGaWxlcycsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFJlZ2lzdGVyIGEgY2FsbGJhY2sgZm9yIHRoZSBgdGV4dERvY3VtZW50L3B1Ymxpc2hEaWFnbm9zdGljc2AgbWVzc2FnZS5cclxuICAvL1xyXG4gIC8vICogYGNhbGxiYWNrYCBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGB0ZXh0RG9jdW1lbnQvcHVibGlzaERpYWdub3N0aWNzYCBtZXNzYWdlIGlzXHJcbiAgLy8gICAgICAgICAgICAgIHJlY2VpdmVkIGEge1B1Ymxpc2hEaWFnbm9zdGljc1BhcmFtc30gY29udGFpbmluZyBuZXcge0RpYWdub3N0aWN9IG1lc3NhZ2VzIGZvciBhIGdpdmVuIHVyaS5cclxuICBwdWJsaWMgb25QdWJsaXNoRGlhZ25vc3RpY3MoY2FsbGJhY2s6IChwYXJhbXM6IGxzcC5QdWJsaXNoRGlhZ25vc3RpY3NQYXJhbXMpID0+IHZvaWQpOiB2b2lkIHtcclxuICAgIHRoaXMuX29uTm90aWZpY2F0aW9uKHttZXRob2Q6ICd0ZXh0RG9jdW1lbnQvcHVibGlzaERpYWdub3N0aWNzJ30sIGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvY29tcGxldGlvbmAgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgICAgICAgICAgICBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvciB7Q29tcGxldGlvblBhcmFtc30gZm9yIHdoaWNoXHJcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgIHtDb21wbGV0aW9uSXRlbX1zIGFyZSBkZXNpcmVkLlxyXG4gIC8vICogYGNhbmNlbGxhdGlvblRva2VuYCBUaGUge0NhbmNlbGxhdGlvblRva2VufSB0aGF0IGlzIHVzZWQgdG8gY2FuY2VsIHRoaXMgcmVxdWVzdCBpZlxyXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICBuZWNlc3NhcnkuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGVpdGhlciBhIHtDb21wbGV0aW9uTGlzdH0gb3IgYW4ge0FycmF5fSBvZiB7Q29tcGxldGlvbkl0ZW19cy5cclxuICBwdWJsaWMgY29tcGxldGlvbihcclxuICAgIHBhcmFtczogbHNwLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zIHwgQ29tcGxldGlvblBhcmFtcyxcclxuICAgIGNhbmNlbGxhdGlvblRva2VuPzoganNvbnJwYy5DYW5jZWxsYXRpb25Ub2tlbik6IFByb21pc2U8bHNwLkNvbXBsZXRpb25JdGVtW10gfCBsc3AuQ29tcGxldGlvbkxpc3Q+IHtcclxuICAgIC8vIENhbmNlbCBwcmlvciByZXF1ZXN0IGlmIG5lY2Vzc2FyeVxyXG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvY29tcGxldGlvbicsIHBhcmFtcywgY2FuY2VsbGF0aW9uVG9rZW4pO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYGNvbXBsZXRpb25JdGVtL3Jlc29sdmVgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7Q29tcGxldGlvbkl0ZW19IGZvciB3aGljaCBhIGZ1bGx5IHJlc29sdmVkIHtDb21wbGV0aW9uSXRlbX0gaXMgZGVzaXJlZC5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYSBmdWxseSByZXNvbHZlZCB7Q29tcGxldGlvbkl0ZW19LlxyXG4gIHB1YmxpYyBjb21wbGV0aW9uSXRlbVJlc29sdmUocGFyYW1zOiBsc3AuQ29tcGxldGlvbkl0ZW0pOiBQcm9taXNlPGxzcC5Db21wbGV0aW9uSXRlbSB8IG51bGw+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgnY29tcGxldGlvbkl0ZW0vcmVzb2x2ZScsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2hvdmVyYCByZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBmb3Igd2hpY2ggYSB7SG92ZXJ9IGlzIGRlc2lyZWQuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGEge0hvdmVyfS5cclxuICBwdWJsaWMgaG92ZXIocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Ib3ZlciB8IG51bGw+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2hvdmVyJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvc2lnbmF0dXJlSGVscGAgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gZm9yIHdoaWNoIGEge1NpZ25hdHVyZUhlbHB9IGlzIGRlc2lyZWQuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGEge1NpZ25hdHVyZUhlbHB9LlxyXG4gIHB1YmxpYyBzaWduYXR1cmVIZWxwKHBhcmFtczogbHNwLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zKTogUHJvbWlzZTxsc3AuU2lnbmF0dXJlSGVscCB8IG51bGw+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L3NpZ25hdHVyZUhlbHAnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kZWZpbml0aW9uYCByZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvZiBhIHN5bWJvbCBmb3Igd2hpY2ggb25lIG9yIG1vcmUge0xvY2F0aW9ufXNcclxuICAvLyB0aGF0IGRlZmluZSB0aGF0IHN5bWJvbCBhcmUgcmVxdWlyZWQuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGVpdGhlciBhIHNpbmdsZSB7TG9jYXRpb259IG9yIGFuIHtBcnJheX0gb2YgbWFueSB7TG9jYXRpb259cy5cclxuICBwdWJsaWMgZ290b0RlZmluaXRpb24ocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Mb2NhdGlvbiB8IGxzcC5Mb2NhdGlvbltdPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9kZWZpbml0aW9uJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvcmVmZXJlbmNlc2AgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtUZXh0RG9jdW1lbnRQb3NpdGlvblBhcmFtc30gb2YgYSBzeW1ib2wgZm9yIHdoaWNoIGFsbCByZWZlcnJpbmcge0xvY2F0aW9ufXNcclxuICAvLyBhcmUgZGVzaXJlZC5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7TG9jYXRpb259cyB0aGF0IHJlZmVyZW5jZSB0aGlzIHN5bWJvbC5cclxuICBwdWJsaWMgZmluZFJlZmVyZW5jZXMocGFyYW1zOiBsc3AuUmVmZXJlbmNlUGFyYW1zKTogUHJvbWlzZTxsc3AuTG9jYXRpb25bXT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvcmVmZXJlbmNlcycsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RvY3VtZW50SGlnaGxpZ2h0YCByZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1RleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zfSBvZiBhIHN5bWJvbCBmb3Igd2hpY2ggYWxsIGhpZ2hsaWdodHMgYXJlIGRlc2lyZWQuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge0RvY3VtZW50SGlnaGxpZ2h0fXMgdGhhdCBjYW4gYmUgdXNlZCB0b1xyXG4gIC8vIGhpZ2hsaWdodCB0aGlzIHN5bWJvbC5cclxuICBwdWJsaWMgZG9jdW1lbnRIaWdobGlnaHQocGFyYW1zOiBsc3AuVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMpOiBQcm9taXNlPGxzcC5Eb2N1bWVudEhpZ2hsaWdodFtdPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9kb2N1bWVudEhpZ2hsaWdodCcsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgdGV4dERvY3VtZW50L2RvY3VtZW50U3ltYm9sYCByZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCAgICAgICAgICAgIFRoZSB7RG9jdW1lbnRTeW1ib2xQYXJhbXN9IHRoYXQgaWRlbnRpZmllcyB0aGUgZG9jdW1lbnQgZm9yIHdoaWNoXHJcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgIHN5bWJvbHMgYXJlIGRlc2lyZWQuXHJcbiAgLy8gKiBgY2FuY2VsbGF0aW9uVG9rZW5gIFRoZSB7Q2FuY2VsbGF0aW9uVG9rZW59IHRoYXQgaXMgdXNlZCB0byBjYW5jZWwgdGhpcyByZXF1ZXN0IGlmXHJcbiAgLy8gICAgICAgICAgICAgICAgICAgICAgIG5lY2Vzc2FyeS5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7U3ltYm9sSW5mb3JtYXRpb259cyB0aGF0IGNhbiBiZSB1c2VkIHRvXHJcbiAgLy8gbmF2aWdhdGUgdGhpcyBkb2N1bWVudC5cclxuICBwdWJsaWMgZG9jdW1lbnRTeW1ib2woXHJcbiAgICBwYXJhbXM6IGxzcC5Eb2N1bWVudFN5bWJvbFBhcmFtcyxcclxuICAgIGNhbmNlbGxhdGlvblRva2VuPzoganNvbnJwYy5DYW5jZWxsYXRpb25Ub2tlbixcclxuICApOiBQcm9taXNlPGxzcC5TeW1ib2xJbmZvcm1hdGlvbltdIHwgbHNwLkRvY3VtZW50U3ltYm9sW10+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2RvY3VtZW50U3ltYm9sJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB3b3Jrc3BhY2Uvc3ltYm9sYCByZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge1dvcmtzcGFjZVN5bWJvbFBhcmFtc30gY29udGFpbmluZyB0aGUgcXVlcnkgc3RyaW5nIHRvIHNlYXJjaCB0aGUgd29ya3NwYWNlIGZvci5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7U3ltYm9sSW5mb3JtYXRpb259cyB0aGF0IGlkZW50aWZ5IHdoZXJlIHRoZSBxdWVyeVxyXG4gIC8vIHN0cmluZyBvY2N1cnMgd2l0aGluIHRoZSB3b3Jrc3BhY2UuXHJcbiAgcHVibGljIHdvcmtzcGFjZVN5bWJvbChwYXJhbXM6IGxzcC5Xb3Jrc3BhY2VTeW1ib2xQYXJhbXMpOiBQcm9taXNlPGxzcC5TeW1ib2xJbmZvcm1hdGlvbltdPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3dvcmtzcGFjZS9zeW1ib2wnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9jb2RlQWN0aW9uYCByZXF1ZXN0LlxyXG4gIC8vXHJcbiAgLy8gKiBgcGFyYW1zYCBUaGUge0NvZGVBY3Rpb25QYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCwgcmFuZ2UgYW5kIGNvbnRleHQgZm9yIHRoZSBjb2RlIGFjdGlvbi5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7Q29tbWFuZHN9cyB0aGF0IGNhbiBiZSBwZXJmb3JtZWQgYWdhaW5zdCB0aGUgZ2l2ZW5cclxuICAvLyBkb2N1bWVudHMgcmFuZ2UuXHJcbiAgcHVibGljIGNvZGVBY3Rpb24ocGFyYW1zOiBsc3AuQ29kZUFjdGlvblBhcmFtcyk6IFByb21pc2U8QXJyYXk8bHNwLkNvbW1hbmQgfCBsc3AuQ29kZUFjdGlvbj4+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2NvZGVBY3Rpb24nLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9jb2RlTGVuc2AgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb2RlTGVuc1BhcmFtc30gaWRlbnRpZnlpbmcgdGhlIGRvY3VtZW50IGZvciB3aGljaCBjb2RlIGxlbnMgY29tbWFuZHMgYXJlIGRlc2lyZWQuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge0NvZGVMZW5zfXMgdGhhdCBhc3NvY2lhdGUgY29tbWFuZHMgYW5kIGRhdGEgd2l0aFxyXG4gIC8vIHNwZWNpZmllZCByYW5nZXMgd2l0aGluIHRoZSBkb2N1bWVudC5cclxuICBwdWJsaWMgY29kZUxlbnMocGFyYW1zOiBsc3AuQ29kZUxlbnNQYXJhbXMpOiBQcm9taXNlPGxzcC5Db2RlTGVuc1tdPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ3RleHREb2N1bWVudC9jb2RlTGVucycsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgY29kZUxlbnMvcmVzb2x2ZWAgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtDb2RlTGVuc30gaWRlbnRpZnlpbmcgdGhlIGNvZGUgbGVucyB0byBiZSByZXNvbHZlZCB3aXRoIGZ1bGwgZGV0YWlsLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0NvZGVMZW5zfSBmdWxseSByZXNvbHZlZC5cclxuICBwdWJsaWMgY29kZUxlbnNSZXNvbHZlKHBhcmFtczogbHNwLkNvZGVMZW5zKTogUHJvbWlzZTxsc3AuQ29kZUxlbnMgfCBudWxsPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ2NvZGVMZW5zL3Jlc29sdmUnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9kb2N1bWVudExpbmtgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRMaW5rUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgZm9yIHdoaWNoIGxpbmtzIHNob3VsZCBiZSBpZGVudGlmaWVkLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7QXJyYXl9IG9mIHtEb2N1bWVudExpbmt9cyByZWxhdGluZyB1cmkncyB0byBzcGVjaWZpYyByYW5nZXNcclxuICAvLyB3aXRoaW4gdGhlIGRvY3VtZW50LlxyXG4gIHB1YmxpYyBkb2N1bWVudExpbmsocGFyYW1zOiBsc3AuRG9jdW1lbnRMaW5rUGFyYW1zKTogUHJvbWlzZTxsc3AuRG9jdW1lbnRMaW5rW10+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2RvY3VtZW50TGluaycsIHBhcmFtcyk7XHJcbiAgfVxyXG5cclxuICAvLyBQdWJsaWM6IFNlbmQgYSBgZG9jdW1lbnRMaW5rL3Jlc29sdmVgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRMaW5rfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgbGluayB0byBiZSByZXNvbHZlZCB3aXRoIGZ1bGwgZGV0YWlsLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyB0aGUge0RvY3VtZW50TGlua30gZnVsbHkgcmVzb2x2ZWQuXHJcbiAgcHVibGljIGRvY3VtZW50TGlua1Jlc29sdmUocGFyYW1zOiBsc3AuRG9jdW1lbnRMaW5rKTogUHJvbWlzZTxsc3AuRG9jdW1lbnRMaW5rPiB7XHJcbiAgICByZXR1cm4gdGhpcy5fc2VuZFJlcXVlc3QoJ2RvY3VtZW50TGluay9yZXNvbHZlJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvZm9ybWF0dGluZ2AgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEb2N1bWVudEZvcm1hdHRpbmdQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQgYXMgd2VsbCBhc1xyXG4gIC8vIGFkZGl0aW9uYWwgZm9ybWF0dGluZyBwcmVmZXJlbmNlcy5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9cyB0byBiZSBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCB0b1xyXG4gIC8vIGNvcnJlY3RseSByZWZvcm1hdCBpdC5cclxuICBwdWJsaWMgZG9jdW1lbnRGb3JtYXR0aW5nKHBhcmFtczogbHNwLkRvY3VtZW50Rm9ybWF0dGluZ1BhcmFtcyk6IFByb21pc2U8bHNwLlRleHRFZGl0W10+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L2Zvcm1hdHRpbmcnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9yYW5nZUZvcm1hdHRpbmdgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7RG9jdW1lbnRSYW5nZUZvcm1hdHRpbmdQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCBhbmQgcmFuZ2UgdG8gYmUgZm9ybWF0dGVkXHJcbiAgLy8gYXMgd2VsbCBhcyBhZGRpdGlvbmFsIGZvcm1hdHRpbmcgcHJlZmVyZW5jZXMuXHJcbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGFuIHtBcnJheX0gb2Yge1RleHRFZGl0fXMgdG8gYmUgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgdG9cclxuICAvLyBjb3JyZWN0bHkgcmVmb3JtYXQgaXQuXHJcbiAgcHVibGljIGRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nKHBhcmFtczogbHNwLkRvY3VtZW50UmFuZ2VGb3JtYXR0aW5nUGFyYW1zKTogUHJvbWlzZTxsc3AuVGV4dEVkaXRbXT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvcmFuZ2VGb3JtYXR0aW5nJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB0ZXh0RG9jdW1lbnQvb25UeXBlRm9ybWF0dGluZ2AgcmVxdWVzdC5cclxuICAvL1xyXG4gIC8vICogYHBhcmFtc2AgVGhlIHtEb2N1bWVudE9uVHlwZUZvcm1hdHRpbmdQYXJhbXN9IGlkZW50aWZ5aW5nIHRoZSBkb2N1bWVudCB0byBiZSBmb3JtYXR0ZWQsXHJcbiAgLy8gdGhlIGNoYXJhY3RlciB0aGF0IHdhcyB0eXBlZCBhbmQgYXQgd2hhdCBwb3NpdGlvbiBhcyB3ZWxsIGFzIGFkZGl0aW9uYWwgZm9ybWF0dGluZyBwcmVmZXJlbmNlcy5cclxuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgYW4ge0FycmF5fSBvZiB7VGV4dEVkaXR9cyB0byBiZSBhcHBsaWVkIHRvIHRoZSBkb2N1bWVudCB0b1xyXG4gIC8vIGNvcnJlY3RseSByZWZvcm1hdCBpdC5cclxuICBwdWJsaWMgZG9jdW1lbnRPblR5cGVGb3JtYXR0aW5nKHBhcmFtczogbHNwLkRvY3VtZW50T25UeXBlRm9ybWF0dGluZ1BhcmFtcyk6IFByb21pc2U8bHNwLlRleHRFZGl0W10+IHtcclxuICAgIHJldHVybiB0aGlzLl9zZW5kUmVxdWVzdCgndGV4dERvY3VtZW50L29uVHlwZUZvcm1hdHRpbmcnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgLy8gUHVibGljOiBTZW5kIGEgYHRleHREb2N1bWVudC9yZW5hbWVgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7UmVuYW1lUGFyYW1zfSBpZGVudGlmeWluZyB0aGUgZG9jdW1lbnQgY29udGFpbmluZyB0aGUgc3ltYm9sIHRvIGJlIHJlbmFtZWQsXHJcbiAgLy8gYXMgd2VsbCBhcyB0aGUgcG9zaXRpb24gYW5kIG5ldyBuYW1lLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbiB7V29ya3NwYWNlRWRpdH0gdGhhdCBjb250YWlucyBhIGxpc3Qgb2Yge1RleHRFZGl0fXMgZWl0aGVyXHJcbiAgLy8gb24gdGhlIGNoYW5nZXMgcHJvcGVydHkgKGtleWVkIGJ5IHVyaSkgb3IgdGhlIGRvY3VtZW50Q2hhbmdlcyBwcm9wZXJ0eSBjb250YWluaW5nXHJcbiAgLy8gYW4ge0FycmF5fSBvZiB7VGV4dERvY3VtZW50RWRpdH1zIChwcmVmZXJyZWQpLlxyXG4gIHB1YmxpYyByZW5hbWUocGFyYW1zOiBsc3AuUmVuYW1lUGFyYW1zKTogUHJvbWlzZTxsc3AuV29ya3NwYWNlRWRpdD4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd0ZXh0RG9jdW1lbnQvcmVuYW1lJywgcGFyYW1zKTtcclxuICB9XHJcblxyXG4gIC8vIFB1YmxpYzogU2VuZCBhIGB3b3Jrc3BhY2UvZXhlY3V0ZUNvbW1hbmRgIHJlcXVlc3QuXHJcbiAgLy9cclxuICAvLyAqIGBwYXJhbXNgIFRoZSB7RXhlY3V0ZUNvbW1hbmRQYXJhbXN9IHNwZWNpZnlpbmcgdGhlIGNvbW1hbmQgYW5kIGFyZ3VtZW50c1xyXG4gIC8vIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgc2hvdWxkIGV4ZWN1dGUgKHRoZXNlIGNvbW1hbmRzIGFyZSB1c3VhbGx5IGZyb20ge0NvZGVMZW5zfSBvciB7Q29kZUFjdGlvbn1cclxuICAvLyByZXNwb25zZXMpLlxyXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gY29udGFpbmluZyBhbnl0aGluZy5cclxuICBwdWJsaWMgZXhlY3V0ZUNvbW1hbmQocGFyYW1zOiBsc3AuRXhlY3V0ZUNvbW1hbmRQYXJhbXMpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgcmV0dXJuIHRoaXMuX3NlbmRSZXF1ZXN0KCd3b3Jrc3BhY2UvZXhlY3V0ZUNvbW1hbmQnLCBwYXJhbXMpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfb25SZXF1ZXN0PFQgZXh0ZW5kcyBFeHRyYWN0PGtleW9mIEtub3duUmVxdWVzdHMsIHN0cmluZz4+KFxyXG4gICAgdHlwZToge21ldGhvZDogVH0sIGNhbGxiYWNrOiBSZXF1ZXN0Q2FsbGJhY2s8VD4sXHJcbiAgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9ycGMub25SZXF1ZXN0KHR5cGUubWV0aG9kLCAodmFsdWUpID0+IHtcclxuICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMub25SZXF1ZXN0ICR7dHlwZS5tZXRob2R9YCwgdmFsdWUpO1xyXG4gICAgICByZXR1cm4gY2FsbGJhY2sodmFsdWUpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9vbk5vdGlmaWNhdGlvbjxUIGV4dGVuZHMgRXh0cmFjdDxrZXlvZiBLbm93bk5vdGlmaWNhdGlvbnMsIHN0cmluZz4+KFxyXG4gICAgdHlwZToge21ldGhvZDogVH0sIGNhbGxiYWNrOiAob2JqOiBLbm93bk5vdGlmaWNhdGlvbnNbVF0pID0+IHZvaWQsXHJcbiAgKTogdm9pZCB7XHJcbiAgICB0aGlzLl9ycGMub25Ob3RpZmljYXRpb24odHlwZS5tZXRob2QsICh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgIHRoaXMuX2xvZy5kZWJ1ZyhgcnBjLm9uTm90aWZpY2F0aW9uICR7dHlwZS5tZXRob2R9YCwgdmFsdWUpO1xyXG4gICAgICBjYWxsYmFjayh2YWx1ZSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3NlbmROb3RpZmljYXRpb24obWV0aG9kOiBzdHJpbmcsIGFyZ3M/OiBvYmplY3QpOiB2b2lkIHtcclxuICAgIHRoaXMuX2xvZy5kZWJ1ZyhgcnBjLnNlbmROb3RpZmljYXRpb24gJHttZXRob2R9YCwgYXJncyk7XHJcbiAgICB0aGlzLl9ycGMuc2VuZE5vdGlmaWNhdGlvbihtZXRob2QsIGFyZ3MpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBfc2VuZFJlcXVlc3QoXHJcbiAgICBtZXRob2Q6IHN0cmluZyxcclxuICAgIGFyZ3M/OiBvYmplY3QsXHJcbiAgICBjYW5jZWxsYXRpb25Ub2tlbj86IGpzb25ycGMuQ2FuY2VsbGF0aW9uVG9rZW4sXHJcbiAgKTogUHJvbWlzZTxhbnk+IHtcclxuICAgIHRoaXMuX2xvZy5kZWJ1ZyhgcnBjLnNlbmRSZXF1ZXN0ICR7bWV0aG9kfSBzZW5kaW5nYCwgYXJncyk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICBpZiAoY2FuY2VsbGF0aW9uVG9rZW4pIHtcclxuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9ycGMuc2VuZFJlcXVlc3QobWV0aG9kLCBhcmdzLCBjYW5jZWxsYXRpb25Ub2tlbik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSWYgY2FuY2VsbGF0aW9uVG9rZW4gaXMgbnVsbCBvciB1bmRlZmluZWQsIGRvbid0IGFkZCB0aGUgdGhpcmRcclxuICAgICAgICAvLyBhcmd1bWVudCBvdGhlcndpc2UgdnNjb2RlLWpzb25ycGMgd2lsbCBzZW5kIGFuIGFkZGl0aW9uYWwsIG51bGxcclxuICAgICAgICAvLyBtZXNzYWdlIHBhcmFtZXRlciB0byB0aGUgcmVxdWVzdFxyXG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuX3JwYy5zZW5kUmVxdWVzdChtZXRob2QsIGFyZ3MpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB0b29rID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydDtcclxuICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMuc2VuZFJlcXVlc3QgJHttZXRob2R9IHJlY2VpdmVkICgke01hdGguZmxvb3IodG9vayl9bXMpYCwgcmVzdWx0KTtcclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc3QgcmVzcG9uc2VFcnJvciA9IGUgYXMganNvbnJwYy5SZXNwb25zZUVycm9yPGFueT47XHJcbiAgICAgIGlmIChjYW5jZWxsYXRpb25Ub2tlbiAmJiByZXNwb25zZUVycm9yLmNvZGUgPT09IGpzb25ycGMuRXJyb3JDb2Rlcy5SZXF1ZXN0Q2FuY2VsbGVkKSB7XHJcbiAgICAgICAgdGhpcy5fbG9nLmRlYnVnKGBycGMuc2VuZFJlcXVlc3QgJHttZXRob2R9IHdhcyBjYW5jZWxsZWRgKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICB0aGlzLl9sb2cuZXJyb3IoYHJwYy5zZW5kUmVxdWVzdCAke21ldGhvZH0gdGhyZXdgLCBlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhyb3cgZTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIERpYWdub3N0aWNDb2RlID0gbnVtYmVyIHwgc3RyaW5nO1xyXG5cclxuLyoqXHJcbiAqIENvbnRhaW5zIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbnRleHQgaW4gd2hpY2ggYSBjb21wbGV0aW9uIHJlcXVlc3QgaXMgdHJpZ2dlcmVkLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBDb21wbGV0aW9uQ29udGV4dCB7XHJcbiAgLyoqXHJcbiAgICogSG93IHRoZSBjb21wbGV0aW9uIHdhcyB0cmlnZ2VyZWQuXHJcbiAgICovXHJcbiAgdHJpZ2dlcktpbmQ6IGxzcC5Db21wbGV0aW9uVHJpZ2dlcktpbmQ7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSB0cmlnZ2VyIGNoYXJhY3RlciAoYSBzaW5nbGUgY2hhcmFjdGVyKSB0aGF0IGhhcyB0cmlnZ2VyIGNvZGUgY29tcGxldGUuXHJcbiAgICogSXMgdW5kZWZpbmVkIGlmIGB0cmlnZ2VyS2luZCAhPT0gQ29tcGxldGlvblRyaWdnZXJLaW5kLlRyaWdnZXJDaGFyYWN0ZXJgXHJcbiAgICovXHJcbiAgdHJpZ2dlckNoYXJhY3Rlcj86IHN0cmluZztcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbXBsZXRpb24gcGFyYW1ldGVyc1xyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBDb21wbGV0aW9uUGFyYW1zIGV4dGVuZHMgbHNwLlRleHREb2N1bWVudFBvc2l0aW9uUGFyYW1zIHtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIGNvbXBsZXRpb24gY29udGV4dC4gVGhpcyBpcyBvbmx5IGF2YWlsYWJsZSBpdCB0aGUgY2xpZW50IHNwZWNpZmllc1xyXG4gICAqIHRvIHNlbmQgdGhpcyB1c2luZyBgQ2xpZW50Q2FwYWJpbGl0aWVzLnRleHREb2N1bWVudC5jb21wbGV0aW9uLmNvbnRleHRTdXBwb3J0ID09PSB0cnVlYFxyXG4gICAqL1xyXG4gIGNvbnRleHQ/OiBDb21wbGV0aW9uQ29udGV4dDtcclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/logger.js":
/*!**************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/logger.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// tslint:disable:no-console
Object.defineProperty(exports, "__esModule", { value: true });
class ConsoleLogger {
    constructor(prefix) {
        this.prefix = prefix;
    }
    warn(...args) {
        console.warn(...this.format(args));
    }
    error(...args) {
        console.error(...this.format(args));
    }
    info(...args) {
        console.info(...this.format(args));
    }
    debug(...args) {
        console.debug(...this.format(args));
    }
    log(...args) {
        console.log(...this.format(args));
    }
    format(args_) {
        const args = args_.filter((a) => a != null);
        if (typeof args[0] === 'string') {
            if (args.length === 1) {
                return [`${this.prefix} ${args[0]}`];
            }
            else if (args.length === 2) {
                return [`${this.prefix} ${args[0]}`, args[1]];
            }
            else {
                return [`${this.prefix} ${args[0]}`, args.slice(1)];
            }
        }
        return [`${this.prefix}`, args];
    }
}
exports.ConsoleLogger = ConsoleLogger;
class NullLogger {
    warn(...args) { }
    error(...args) { }
    info(...args) { }
    log(...args) { }
    debug(...args) { }
}
exports.NullLogger = NullLogger;
class FilteredLogger {
    constructor(logger, predicate) {
        this._logger = logger;
        this._predicate = predicate || ((level, args) => true);
    }
    warn(...args) {
        if (this._predicate('warn', args)) {
            this._logger.warn(...args);
        }
    }
    error(...args) {
        if (this._predicate('error', args)) {
            this._logger.error(...args);
        }
    }
    info(...args) {
        if (this._predicate('info', args)) {
            this._logger.info(...args);
        }
    }
    debug(...args) {
        if (this._predicate('debug', args)) {
            this._logger.debug(...args);
        }
    }
    log(...args) {
        if (this._predicate('log', args)) {
            this._logger.log(...args);
        }
    }
}
FilteredLogger.UserLevelFilter = (level, args) => level === 'warn' || level === 'error';
FilteredLogger.DeveloperLevelFilter = (level, args) => true;
exports.FilteredLogger = FilteredLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUMsNEJBQTRCOztBQVU3QixNQUFhLGFBQWE7SUFHeEIsWUFBWSxNQUFjO1FBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFTSxJQUFJLENBQUMsR0FBRyxJQUFXO1FBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVNLEtBQUssQ0FBQyxHQUFHLElBQVc7UUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRU0sSUFBSSxDQUFDLEdBQUcsSUFBVztRQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFTSxLQUFLLENBQUMsR0FBRyxJQUFXO1FBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVNLEdBQUcsQ0FBQyxHQUFHLElBQVc7UUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU0sTUFBTSxDQUFDLEtBQVU7UUFDdEIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQ2pELElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQy9C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NUUsd0NBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiIC8vIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGVcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTG9nZ2VyIHtcclxuICB3YXJuKC4uLmFyZ3M6IGFueVtdKTogdm9pZDtcclxuICBlcnJvciguLi5hcmdzOiBhbnlbXSk6IHZvaWQ7XHJcbiAgaW5mbyguLi5hcmdzOiBhbnlbXSk6IHZvaWQ7XHJcbiAgbG9nKC4uLmFyZ3M6IGFueVtdKTogdm9pZDtcclxuICBkZWJ1ZyguLi5hcmdzOiBhbnlbXSk6IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb25zb2xlTG9nZ2VyIHtcclxuICBwdWJsaWMgcHJlZml4OiBzdHJpbmc7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByZWZpeDogc3RyaW5nKSB7XHJcbiAgICB0aGlzLnByZWZpeCA9IHByZWZpeDtcclxuICB9XHJcblxyXG4gIHB1YmxpYyB3YXJuKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBjb25zb2xlLndhcm4oLi4udGhpcy5mb3JtYXQoYXJncykpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGVycm9yKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBjb25zb2xlLmVycm9yKC4uLnRoaXMuZm9ybWF0KGFyZ3MpKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBpbmZvKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBjb25zb2xlLmluZm8oLi4udGhpcy5mb3JtYXQoYXJncykpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRlYnVnKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBjb25zb2xlLmRlYnVnKC4uLnRoaXMuZm9ybWF0KGFyZ3MpKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBsb2coLi4uYXJnczogYW55W10pOiB2b2lkIHtcclxuICAgIGNvbnNvbGUubG9nKC4uLnRoaXMuZm9ybWF0KGFyZ3MpKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBmb3JtYXQoYXJnc186IGFueSk6IGFueSB7XHJcbiAgICBjb25zdCBhcmdzID0gYXJnc18uZmlsdGVyKChhOiBhbnkpID0+IGEgIT0gbnVsbCk7XHJcbiAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiBbYCR7dGhpcy5wcmVmaXh9ICR7YXJnc1swXX1gXTtcclxuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgIHJldHVybiBbYCR7dGhpcy5wcmVmaXh9ICR7YXJnc1swXX1gLCBhcmdzWzFdXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gW2Ake3RoaXMucHJlZml4fSAke2FyZ3NbMF19YCwgYXJncy5zbGljZSgxKV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW2Ake3RoaXMucHJlZml4fWAsIGFyZ3NdO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE51bGxMb2dnZXIge1xyXG4gIHB1YmxpYyB3YXJuKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7fVxyXG4gIHB1YmxpYyBlcnJvciguLi5hcmdzOiBhbnlbXSk6IHZvaWQge31cclxuICBwdWJsaWMgaW5mbyguLi5hcmdzOiBhbnlbXSk6IHZvaWQge31cclxuICBwdWJsaWMgbG9nKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7fVxyXG4gIHB1YmxpYyBkZWJ1ZyguLi5hcmdzOiBhbnlbXSk6IHZvaWQge31cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZpbHRlcmVkTG9nZ2VyIHtcclxuICBwcml2YXRlIF9sb2dnZXI6IExvZ2dlcjtcclxuICBwcml2YXRlIF9wcmVkaWNhdGU6IChsZXZlbDogc3RyaW5nLCBhcmdzOiBhbnlbXSkgPT4gYm9vbGVhbjtcclxuXHJcbiAgcHVibGljIHN0YXRpYyBVc2VyTGV2ZWxGaWx0ZXIgPSAobGV2ZWw6IHN0cmluZywgYXJnczogYW55W10pID0+IGxldmVsID09PSAnd2FybicgfHwgbGV2ZWwgPT09ICdlcnJvcic7XHJcbiAgcHVibGljIHN0YXRpYyBEZXZlbG9wZXJMZXZlbEZpbHRlciA9IChsZXZlbDogc3RyaW5nLCBhcmdzOiBhbnlbXSkgPT4gdHJ1ZTtcclxuXHJcbiAgY29uc3RydWN0b3IobG9nZ2VyOiBMb2dnZXIsIHByZWRpY2F0ZT86IChsZXZlbDogc3RyaW5nLCBhcmdzOiBhbnlbXSkgPT4gYm9vbGVhbikge1xyXG4gICAgdGhpcy5fbG9nZ2VyID0gbG9nZ2VyO1xyXG4gICAgdGhpcy5fcHJlZGljYXRlID0gcHJlZGljYXRlIHx8ICgobGV2ZWwsIGFyZ3MpID0+IHRydWUpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHdhcm4oLi4uYXJnczogYW55W10pOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9wcmVkaWNhdGUoJ3dhcm4nLCBhcmdzKSkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIud2FybiguLi5hcmdzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBlcnJvciguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX3ByZWRpY2F0ZSgnZXJyb3InLCBhcmdzKSkge1xyXG4gICAgICB0aGlzLl9sb2dnZXIuZXJyb3IoLi4uYXJncyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5mbyguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX3ByZWRpY2F0ZSgnaW5mbycsIGFyZ3MpKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5pbmZvKC4uLmFyZ3MpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGRlYnVnKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5fcHJlZGljYXRlKCdkZWJ1ZycsIGFyZ3MpKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5kZWJ1ZyguLi5hcmdzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyBsb2coLi4uYXJnczogYW55W10pOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLl9wcmVkaWNhdGUoJ2xvZycsIGFyZ3MpKSB7XHJcbiAgICAgIHRoaXMuX2xvZ2dlci5sb2coLi4uYXJncyk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/main.js":
/*!************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/main.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// tslint:disable:no-reference
/// <reference path="../typings/atom/index.d.ts"/>
/// <reference path="../typings/atom-ide/index.d.ts"/>
// tslint:enable:no-reference
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const auto_languageclient_1 = __webpack_require__(/*! ./auto-languageclient */ "./node_modules/atom-languageclient/build/lib/auto-languageclient.js");
exports.AutoLanguageClient = auto_languageclient_1.default;
const convert_1 = __webpack_require__(/*! ./convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
exports.Convert = convert_1.default;
const logger_1 = __webpack_require__(/*! ./logger */ "./node_modules/atom-languageclient/build/lib/logger.js");
exports.ConsoleLogger = logger_1.ConsoleLogger;
exports.FilteredLogger = logger_1.FilteredLogger;
const download_file_1 = __webpack_require__(/*! ./download-file */ "./node_modules/atom-languageclient/build/lib/download-file.js");
exports.DownloadFile = download_file_1.default;
const linter_push_v2_adapter_1 = __webpack_require__(/*! ./adapters/linter-push-v2-adapter */ "./node_modules/atom-languageclient/build/lib/adapters/linter-push-v2-adapter.js");
exports.LinterPushV2Adapter = linter_push_v2_adapter_1.default;
__export(__webpack_require__(/*! ./auto-languageclient */ "./node_modules/atom-languageclient/build/lib/auto-languageclient.js"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw4QkFBOEI7QUFDOUIsa0RBQWtEO0FBQ2xELHNEQUFzRDtBQUN0RCw2QkFBNkI7Ozs7O0FBRTdCLCtEQUF1RDtBQVFyRCw2QkFSSyw2QkFBa0IsQ0FRTDtBQVBwQix1Q0FBZ0M7QUFROUIsa0JBUkssaUJBQU8sQ0FRTDtBQVBULHFDQUFpRTtBQVMvRCx3QkFUZSxzQkFBYSxDQVNmO0FBQ2IseUJBVjhCLHVCQUFjLENBVTlCO0FBVGhCLG1EQUEyQztBQVV6Qyx1QkFWSyx1QkFBWSxDQVVMO0FBVGQsOEVBQW9FO0FBVWxFLDhCQVZLLGdDQUFtQixDQVVMO0FBUnJCLDJDQUFzQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOm5vLXJlZmVyZW5jZVxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9hdG9tL2luZGV4LmQudHNcIi8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2F0b20taWRlL2luZGV4LmQudHNcIi8+XHJcbi8vIHRzbGludDplbmFibGU6bm8tcmVmZXJlbmNlXHJcblxyXG5pbXBvcnQgQXV0b0xhbmd1YWdlQ2xpZW50IGZyb20gJy4vYXV0by1sYW5ndWFnZWNsaWVudCc7XHJcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4vY29udmVydCc7XHJcbmltcG9ydCB7IExvZ2dlciwgQ29uc29sZUxvZ2dlciwgRmlsdGVyZWRMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XHJcbmltcG9ydCBEb3dubG9hZEZpbGUgZnJvbSAnLi9kb3dubG9hZC1maWxlJztcclxuaW1wb3J0IExpbnRlclB1c2hWMkFkYXB0ZXIgZnJvbSAnLi9hZGFwdGVycy9saW50ZXItcHVzaC12Mi1hZGFwdGVyJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJy4vYXV0by1sYW5ndWFnZWNsaWVudCc7XHJcbmV4cG9ydCB7XHJcbiAgQXV0b0xhbmd1YWdlQ2xpZW50LFxyXG4gIENvbnZlcnQsXHJcbiAgTG9nZ2VyLFxyXG4gIENvbnNvbGVMb2dnZXIsXHJcbiAgRmlsdGVyZWRMb2dnZXIsXHJcbiAgRG93bmxvYWRGaWxlLFxyXG4gIExpbnRlclB1c2hWMkFkYXB0ZXIsXHJcbn07XHJcbiJdfQ==

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/server-manager.js":
/*!**********************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/server-manager.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = __webpack_require__(/*! ./convert */ "./node_modules/atom-languageclient/build/lib/convert.js");
const path = __webpack_require__(/*! path */ "path");
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
// Manages the language server lifecycles and their associated objects necessary
// for adapting them to Atom IDE.
class ServerManager {
    constructor(_startServer, _logger, _startForEditor, _changeWatchedFileFilter, _reportBusyWhile, _languageServerName) {
        this._startServer = _startServer;
        this._logger = _logger;
        this._startForEditor = _startForEditor;
        this._changeWatchedFileFilter = _changeWatchedFileFilter;
        this._reportBusyWhile = _reportBusyWhile;
        this._languageServerName = _languageServerName;
        this._activeServers = [];
        this._startingServerPromises = new Map();
        this._restartCounterPerProject = new Map();
        this._stoppingServers = [];
        this._disposable = new atom_1.CompositeDisposable();
        this._editorToServer = new Map();
        this._normalizedProjectPaths = [];
        this._isStarted = false;
        this.updateNormalizedProjectPaths();
    }
    startListening() {
        if (!this._isStarted) {
            this._disposable = new atom_1.CompositeDisposable();
            this._disposable.add(atom.textEditors.observe(this.observeTextEditors.bind(this)));
            this._disposable.add(atom.project.onDidChangePaths(this.projectPathsChanged.bind(this)));
            if (atom.project.onDidChangeFiles) {
                this._disposable.add(atom.project.onDidChangeFiles(this.projectFilesChanged.bind(this)));
            }
        }
    }
    stopListening() {
        if (this._isStarted) {
            this._disposable.dispose();
            this._isStarted = false;
        }
    }
    observeTextEditors(editor) {
        // Track grammar changes for opened editors
        const listener = editor.observeGrammar((_grammar) => this._handleGrammarChange(editor));
        this._disposable.add(editor.onDidDestroy(() => listener.dispose()));
        // Try to see if editor can have LS connected to it
        this._handleTextEditor(editor);
    }
    _handleTextEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._editorToServer.has(editor)) {
                // editor hasn't been processed yet, so process it by allocating LS for it if necessary
                const server = yield this.getServer(editor, { shouldStart: true });
                if (server != null) {
                    // There LS for the editor (either started now and already running)
                    this._editorToServer.set(editor, server);
                    this._disposable.add(editor.onDidDestroy(() => {
                        this._editorToServer.delete(editor);
                        this.stopUnusedServers();
                    }));
                }
            }
        });
    }
    _handleGrammarChange(editor) {
        if (this._startForEditor(editor)) {
            // If editor is interesting for LS process the editor further to attempt to start LS if needed
            this._handleTextEditor(editor);
        }
        else {
            // Editor is not supported by the LS
            const server = this._editorToServer.get(editor);
            // If LS is running for the unsupported editor then disconnect the editor from LS and shut down LS if necessary
            if (server) {
                // Remove editor from the cache
                this._editorToServer.delete(editor);
                // Shut down LS if it's used by any other editor
                this.stopUnusedServers();
            }
        }
    }
    getActiveServers() {
        return this._activeServers.slice();
    }
    getServer(textEditor, { shouldStart } = { shouldStart: false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalProjectPath = this.determineProjectPath(textEditor);
            if (finalProjectPath == null) {
                // Files not yet saved have no path
                return null;
            }
            const foundActiveServer = this._activeServers.find((s) => finalProjectPath === s.projectPath);
            if (foundActiveServer) {
                return foundActiveServer;
            }
            const startingPromise = this._startingServerPromises.get(finalProjectPath);
            if (startingPromise) {
                return startingPromise;
            }
            return shouldStart && this._startForEditor(textEditor) ? yield this.startServer(finalProjectPath) : null;
        });
    }
    startServer(projectPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.debug(`Server starting "${projectPath}"`);
            const startingPromise = this._startServer(projectPath);
            this._startingServerPromises.set(projectPath, startingPromise);
            try {
                const startedActiveServer = yield startingPromise;
                this._activeServers.push(startedActiveServer);
                this._startingServerPromises.delete(projectPath);
                this._logger.debug(`Server started "${projectPath}" (pid ${startedActiveServer.process.pid})`);
                return startedActiveServer;
            }
            catch (e) {
                this._startingServerPromises.delete(projectPath);
                throw e;
            }
        });
    }
    stopUnusedServers() {
        return __awaiter(this, void 0, void 0, function* () {
            const usedServers = new Set(this._editorToServer.values());
            const unusedServers = this._activeServers.filter((s) => !usedServers.has(s));
            if (unusedServers.length > 0) {
                this._logger.debug(`Stopping ${unusedServers.length} unused servers`);
                yield Promise.all(unusedServers.map((s) => this.stopServer(s)));
            }
        });
    }
    stopAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [projectPath, restartCounter] of this._restartCounterPerProject) {
                clearTimeout(restartCounter.timerId);
                this._restartCounterPerProject.delete(projectPath);
            }
            yield Promise.all(this._activeServers.map((s) => this.stopServer(s)));
        });
    }
    restartAllServers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stopListening();
            yield this.stopAllServers();
            this._editorToServer = new Map();
            this.startListening();
        });
    }
    hasServerReachedRestartLimit(server) {
        let restartCounter = this._restartCounterPerProject.get(server.projectPath);
        if (!restartCounter) {
            restartCounter = {
                restarts: 0,
                timerId: setTimeout(() => {
                    this._restartCounterPerProject.delete(server.projectPath);
                }, 3 * 60 * 1000 /* 3 minutes */),
            };
            this._restartCounterPerProject.set(server.projectPath, restartCounter);
        }
        return ++restartCounter.restarts > 5;
    }
    stopServer(server) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._reportBusyWhile(`Stopping ${this._languageServerName} for ${path.basename(server.projectPath)}`, () => __awaiter(this, void 0, void 0, function* () {
                this._logger.debug(`Server stopping "${server.projectPath}"`);
                // Immediately remove the server to prevent further usage.
                // If we re-open the file after this point, we'll get a new server.
                this._activeServers.splice(this._activeServers.indexOf(server), 1);
                this._stoppingServers.push(server);
                server.disposable.dispose();
                if (server.connection.isConnected) {
                    yield server.connection.shutdown();
                }
                for (const [editor, mappedServer] of this._editorToServer) {
                    if (mappedServer === server) {
                        this._editorToServer.delete(editor);
                    }
                }
                this.exitServer(server);
                this._stoppingServers.splice(this._stoppingServers.indexOf(server), 1);
            }));
        });
    }
    exitServer(server) {
        const pid = server.process.pid;
        try {
            if (server.connection.isConnected) {
                server.connection.exit();
                server.connection.dispose();
            }
        }
        finally {
            server.process.kill();
        }
        this._logger.debug(`Server stopped "${server.projectPath}" (pid ${pid})`);
    }
    terminate() {
        this._stoppingServers.forEach((server) => {
            this._logger.debug(`Server terminating "${server.projectPath}"`);
            this.exitServer(server);
        });
    }
    determineProjectPath(textEditor) {
        const filePath = textEditor.getPath();
        if (filePath == null) {
            return null;
        }
        return this._normalizedProjectPaths.find((d) => filePath.startsWith(d)) || null;
    }
    updateNormalizedProjectPaths() {
        this._normalizedProjectPaths = atom.project.getDirectories().map((d) => this.normalizePath(d.getPath()));
    }
    normalizePath(projectPath) {
        return !projectPath.endsWith(path.sep) ? path.join(projectPath, path.sep) : projectPath;
    }
    projectPathsChanged(projectPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            const pathsSet = new Set(projectPaths.map(this.normalizePath));
            const serversToStop = this._activeServers.filter((s) => !pathsSet.has(s.projectPath));
            yield Promise.all(serversToStop.map((s) => this.stopServer(s)));
            this.updateNormalizedProjectPaths();
        });
    }
    projectFilesChanged(fileEvents) {
        if (this._activeServers.length === 0) {
            return;
        }
        for (const activeServer of this._activeServers) {
            const changes = [];
            for (const fileEvent of fileEvents) {
                if (fileEvent.path.startsWith(activeServer.projectPath) && this._changeWatchedFileFilter(fileEvent.path)) {
                    changes.push(convert_1.default.atomFileEventToLSFileEvents(fileEvent)[0]);
                }
                if (fileEvent.action === 'renamed' &&
                    fileEvent.oldPath.startsWith(activeServer.projectPath) &&
                    this._changeWatchedFileFilter(fileEvent.oldPath)) {
                    changes.push(convert_1.default.atomFileEventToLSFileEvents(fileEvent)[1]);
                }
            }
            if (changes.length > 0) {
                activeServer.connection.didChangeWatchedFiles({ changes });
            }
        }
    }
}
exports.ServerManager = ServerManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLW1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc2VydmVyLW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHVDQUFnQztBQUNoQyw2QkFBNkI7QUFLN0IsK0JBSWM7QUFnQ2QsZ0ZBQWdGO0FBQ2hGLGlDQUFpQztBQUNqQyxNQUFhLGFBQWE7SUFVeEIsWUFDVSxZQUE0RCxFQUM1RCxPQUFlLEVBQ2YsZUFBZ0QsRUFDaEQsd0JBQXVELEVBQ3ZELGdCQUFpQyxFQUNqQyxtQkFBMkI7UUFMM0IsaUJBQVksR0FBWixZQUFZLENBQWdEO1FBQzVELFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixvQkFBZSxHQUFmLGVBQWUsQ0FBaUM7UUFDaEQsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUErQjtRQUN2RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWlCO1FBQ2pDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBUTtRQWY3QixtQkFBYyxHQUFtQixFQUFFLENBQUM7UUFDcEMsNEJBQXVCLEdBQXVDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEUsOEJBQXlCLEdBQWdDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDbkUscUJBQWdCLEdBQW1CLEVBQUUsQ0FBQztRQUN0QyxnQkFBVyxHQUF3QixJQUFJLDBCQUFtQixFQUFFLENBQUM7UUFDN0Qsb0JBQWUsR0FBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMzRCw0QkFBdUIsR0FBYSxFQUFFLENBQUM7UUFDdkMsZUFBVSxHQUFHLEtBQUssQ0FBQztRQVV6QixJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBRU0sY0FBYztRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztZQUM3QyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcs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QyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDeEcsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBTyxDQUFDLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2pFO2dCQUNELElBQ0UsU0FBUyxDQUFDLE1BQU0sS0FBSyxTQUFTO29CQUM5QixTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO29CQUN0RCxJQUFJLENBQUMsd0JBQXdCLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUNoRDtvQkFDQSxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFPLENBQUMsMkJBQTJCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDakU7YUFDRjtZQUNELElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3RCLFlBQVksQ0FBQyxVQUFVLENBQUMscUJBQXFCLENBQUMsRUFBQyxPQUFPLEVBQUMsQ0FBQyxDQUFDO2FBQzFEO1NBQ0Y7SUFDSCxDQUFDO0NBQ0Y7QUFuUUQsc0NBbVFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENvbnZlcnQgZnJvbSAnLi9jb252ZXJ0JztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0ICogYXMgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XHJcbmltcG9ydCAqIGFzIGxzIGZyb20gJy4vbGFuZ3VhZ2VjbGllbnQnO1xyXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xyXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuL2xvZ2dlcic7XHJcbmltcG9ydCB7XHJcbiAgQ29tcG9zaXRlRGlzcG9zYWJsZSxcclxuICBGaWxlc3lzdGVtQ2hhbmdlRXZlbnQsXHJcbiAgVGV4dEVkaXRvcixcclxufSBmcm9tICdhdG9tJztcclxuaW1wb3J0IHsgUmVwb3J0QnVzeVdoaWxlIH0gZnJvbSAnLi91dGlscyc7XHJcblxyXG4vLyBQdWJsaWM6IERlZmluZXMgdGhlIG1pbmltdW0gc3VyZmFjZSBhcmVhIGZvciBhbiBvYmplY3QgdGhhdCByZXNlbWJsZXMgYVxyXG4vLyBDaGlsZFByb2Nlc3MuICBUaGlzIGlzIHVzZWQgc28gdGhhdCBsYW5ndWFnZSBwYWNrYWdlcyB3aXRoIGFsdGVybmF0aXZlXHJcbi8vIGxhbmd1YWdlIHNlcnZlciBwcm9jZXNzIGhvc3Rpbmcgc3RyYXRlZ2llcyBjYW4gcmV0dXJuIHNvbWV0aGluZyBjb21wYXRpYmxlXHJcbi8vIHdpdGggQXV0b0xhbmd1YWdlQ2xpZW50LnN0YXJ0U2VydmVyUHJvY2Vzcy5cclxuZXhwb3J0IGludGVyZmFjZSBMYW5ndWFnZVNlcnZlclByb2Nlc3MgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG4gIHN0ZGluOiBzdHJlYW0uV3JpdGFibGU7XHJcbiAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGU7XHJcbiAgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGU7XHJcbiAgcGlkOiBudW1iZXI7XHJcblxyXG4gIGtpbGwoc2lnbmFsPzogc3RyaW5nKTogdm9pZDtcclxuICBvbihldmVudDogJ2Vycm9yJywgbGlzdGVuZXI6IChlcnI6IEVycm9yKSA9PiB2b2lkKTogdGhpcztcclxuICBvbihldmVudDogJ2V4aXQnLCBsaXN0ZW5lcjogKGNvZGU6IG51bWJlciwgc2lnbmFsOiBzdHJpbmcpID0+IHZvaWQpOiB0aGlzO1xyXG59XHJcblxyXG4vLyBUaGUgbmVjZXNzYXJ5IGVsZW1lbnRzIGZvciBhIHNlcnZlciB0aGF0IGhhcyBzdGFydGVkIG9yIGlzIHN0YXJ0aW5nLlxyXG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2ZVNlcnZlciB7XHJcbiAgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcclxuICBwcm9qZWN0UGF0aDogc3RyaW5nO1xyXG4gIHByb2Nlc3M6IExhbmd1YWdlU2VydmVyUHJvY2VzcztcclxuICBjb25uZWN0aW9uOiBscy5MYW5ndWFnZUNsaWVudENvbm5lY3Rpb247XHJcbiAgY2FwYWJpbGl0aWVzOiBscy5TZXJ2ZXJDYXBhYmlsaXRpZXM7XHJcbn1cclxuXHJcbmludGVyZmFjZSBSZXN0YXJ0Q291bnRlciB7XHJcbiAgcmVzdGFydHM6IG51bWJlcjtcclxuICB0aW1lcklkOiBOb2RlSlMuVGltZXI7XHJcbn1cclxuXHJcbi8vIE1hbmFnZXMgdGhlIGxhbmd1YWdlIHNlcnZlciBsaWZlY3ljbGVzIGFuZCB0aGVpciBhc3NvY2lhdGVkIG9iamVjdHMgbmVjZXNzYXJ5XHJcbi8vIGZvciBhZGFwdGluZyB0aGVtIHRvIEF0b20gSURFLlxyXG5leHBvcnQgY2xhc3MgU2VydmVyTWFuYWdlciB7XHJcbiAgcHJpdmF0ZSBfYWN0aXZlU2VydmVyczogQWN0aXZlU2VydmVyW10gPSBbXTtcclxuICBwcml2YXRlIF9zdGFydGluZ1NlcnZlclByb21pc2VzOiBNYXA8c3RyaW5nLCBQcm9taXNlPEFjdGl2ZVNlcnZlcj4+ID0gbmV3IE1hcCgpO1xyXG4gIHByaXZhdGUgX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdDogTWFwPHN0cmluZywgUmVzdGFydENvdW50ZXI+ID0gbmV3IE1hcCgpO1xyXG4gIHByaXZhdGUgX3N0b3BwaW5nU2VydmVyczogQWN0aXZlU2VydmVyW10gPSBbXTtcclxuICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICBwcml2YXRlIF9lZGl0b3JUb1NlcnZlcjogTWFwPFRleHRFZGl0b3IsIEFjdGl2ZVNlcnZlcj4gPSBuZXcgTWFwKCk7XHJcbiAgcHJpdmF0ZSBfbm9ybWFsaXplZFByb2plY3RQYXRoczogc3RyaW5nW10gPSBbXTtcclxuICBwcml2YXRlIF9pc1N0YXJ0ZWQgPSBmYWxzZTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIF9zdGFydFNlcnZlcjogKHByb2plY3RQYXRoOiBzdHJpbmcpID0+IFByb21pc2U8QWN0aXZlU2VydmVyPixcclxuICAgIHByaXZhdGUgX2xvZ2dlcjogTG9nZ2VyLFxyXG4gICAgcHJpdmF0ZSBfc3RhcnRGb3JFZGl0b3I6IChlZGl0b3I6IFRleHRFZGl0b3IpID0+IGJvb2xlYW4sXHJcbiAgICBwcml2YXRlIF9jaGFuZ2VXYXRjaGVkRmlsZUZpbHRlcjogKGZpbGVQYXRoOiBzdHJpbmcpID0+IGJvb2xlYW4sXHJcbiAgICBwcml2YXRlIF9yZXBvcnRCdXN5V2hpbGU6IFJlcG9ydEJ1c3lXaGlsZSxcclxuICAgIHByaXZhdGUgX2xhbmd1YWdlU2VydmVyTmFtZTogc3RyaW5nLFxyXG4gICkge1xyXG4gICAgdGhpcy51cGRhdGVOb3JtYWxpemVkUHJvamVjdFBhdGhzKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhcnRMaXN0ZW5pbmcoKTogdm9pZCB7XHJcbiAgICBpZiAoIXRoaXMuX2lzU3RhcnRlZCkge1xyXG4gICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcclxuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS50ZXh0RWRpdG9ycy5vYnNlcnZlKHRoaXMub2JzZXJ2ZVRleHRFZGl0b3JzLmJpbmQodGhpcykpKTtcclxuICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHModGhpcy5wcm9qZWN0UGF0aHNDaGFuZ2VkLmJpbmQodGhpcykpKTtcclxuICAgICAgaWYgKGF0b20ucHJvamVjdC5vbkRpZENoYW5nZUZpbGVzKSB7XHJcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlRmlsZXModGhpcy5wcm9qZWN0RmlsZXNDaGFuZ2VkLmJpbmQodGhpcykpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHN0b3BMaXN0ZW5pbmcoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5faXNTdGFydGVkKSB7XHJcbiAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICB0aGlzLl9pc1N0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgb2JzZXJ2ZVRleHRFZGl0b3JzKGVkaXRvcjogVGV4dEVkaXRvcik6IHZvaWQge1xyXG4gICAgLy8gVHJhY2sgZ3JhbW1hciBjaGFuZ2VzIGZvciBvcGVuZWQgZWRpdG9yc1xyXG4gICAgY29uc3QgbGlzdGVuZXIgPSBlZGl0b3Iub2JzZXJ2ZUdyYW1tYXIoKF9ncmFtbWFyKSA9PiB0aGlzLl9oYW5kbGVHcmFtbWFyQ2hhbmdlKGVkaXRvcikpO1xyXG4gICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiBsaXN0ZW5lci5kaXNwb3NlKCkpKTtcclxuICAgIC8vIFRyeSB0byBzZWUgaWYgZWRpdG9yIGNhbiBoYXZlIExTIGNvbm5lY3RlZCB0byBpdFxyXG4gICAgdGhpcy5faGFuZGxlVGV4dEVkaXRvcihlZGl0b3IpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBfaGFuZGxlVGV4dEVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICghdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuaGFzKGVkaXRvcikpIHtcclxuICAgICAgLy8gZWRpdG9yIGhhc24ndCBiZWVuIHByb2Nlc3NlZCB5ZXQsIHNvIHByb2Nlc3MgaXQgYnkgYWxsb2NhdGluZyBMUyBmb3IgaXQgaWYgbmVjZXNzYXJ5XHJcbiAgICAgIGNvbnN0IHNlcnZlciA9IGF3YWl0IHRoaXMuZ2V0U2VydmVyKGVkaXRvciwge3Nob3VsZFN0YXJ0OiB0cnVlfSk7XHJcbiAgICAgIGlmIChzZXJ2ZXIgIT0gbnVsbCkge1xyXG4gICAgICAgIC8vIFRoZXJlIExTIGZvciB0aGUgZWRpdG9yIChlaXRoZXIgc3RhcnRlZCBub3cgYW5kIGFscmVhZHkgcnVubmluZylcclxuICAgICAgICB0aGlzLl9lZGl0b3JUb1NlcnZlci5zZXQoZWRpdG9yLCBzZXJ2ZXIpO1xyXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKFxyXG4gICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvclRvU2VydmVyLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgICAgICB0aGlzLnN0b3BVbnVzZWRTZXJ2ZXJzKCk7XHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9oYW5kbGVHcmFtbWFyQ2hhbmdlKGVkaXRvcjogVGV4dEVkaXRvcikge1xyXG4gICAgaWYgKHRoaXMuX3N0YXJ0Rm9yRWRpdG9yKGVkaXRvcikpIHtcclxuICAgICAgLy8gSWYgZWRpdG9yIGlzIGludGVyZXN0aW5nIGZvciBMUyBwcm9jZXNzIHRoZSBlZGl0b3IgZnVydGhlciB0byBhdHRlbXB0IHRvIHN0YXJ0IExTIGlmIG5lZWRlZFxyXG4gICAgICB0aGlzLl9oYW5kbGVUZXh0RWRpdG9yKGVkaXRvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBFZGl0b3IgaXMgbm90IHN1cHBvcnRlZCBieSB0aGUgTFNcclxuICAgICAgY29uc3Qgc2VydmVyID0gdGhpcy5fZWRpdG9yVG9TZXJ2ZXIuZ2V0KGVkaXRvcik7XHJcbiAgICAgIC8vIElmIExTIGlzIHJ1bm5pbmcgZm9yIHRoZSB1bnN1cHBvcnRlZCBlZGl0b3IgdGhlbiBkaXNjb25uZWN0IHRoZSBlZGl0b3IgZnJvbSBMUyBhbmQgc2h1dCBkb3duIExTIGlmIG5lY2Vzc2FyeVxyXG4gICAgICBpZiAoc2VydmVyKSB7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGVkaXRvciBmcm9tIHRoZSBjYWNoZVxyXG4gICAgICAgIHRoaXMuX2VkaXRvclRvU2VydmVyLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgIC8vIFNodXQgZG93biBMUyBpZiBpdCdzIHVzZWQgYnkgYW55IG90aGVyIGVkaXRvclxyXG4gICAgICAgIHRoaXMuc3RvcFVudXNlZFNlcnZlcnMoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldEFjdGl2ZVNlcnZlcnMoKTogQWN0aXZlU2VydmVyW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNlcnZlcnMuc2xpY2UoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBnZXRTZXJ2ZXIoXHJcbiAgICB0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLFxyXG4gICAge3Nob3VsZFN0YXJ0fToge3Nob3VsZFN0YXJ0PzogYm9vbGVhbn0gPSB7c2hvdWxkU3RhcnQ6IGZhbHNlfSxcclxuICApOiBQcm9taXNlPEFjdGl2ZVNlcnZlciB8IG51bGw+IHtcclxuICAgIGNvbnN0IGZpbmFsUHJvamVjdFBhdGggPSB0aGlzLmRldGVybWluZVByb2plY3RQYXRoKHRleHRFZGl0b3IpO1xyXG4gICAgaWYgKGZpbmFsUHJvamVjdFBhdGggPT0gbnVsbCkge1xyXG4gICAgICAvLyBGaWxlcyBub3QgeWV0IHNhdmVkIGhhdmUgbm8gcGF0aFxyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmb3VuZEFjdGl2ZVNlcnZlciA9IHRoaXMuX2FjdGl2ZVNlcnZlcnMuZmluZCgocykgPT4gZmluYWxQcm9qZWN0UGF0aCA9PT0gcy5wcm9qZWN0UGF0aCk7XHJcbiAgICBpZiAoZm91bmRBY3RpdmVTZXJ2ZXIpIHtcclxuICAgICAgcmV0dXJuIGZvdW5kQWN0aXZlU2VydmVyO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0YXJ0aW5nUHJvbWlzZSA9IHRoaXMuX3N0YXJ0aW5nU2VydmVyUHJvbWlzZXMuZ2V0KGZpbmFsUHJvamVjdFBhdGgpO1xyXG4gICAgaWYgKHN0YXJ0aW5nUHJvbWlzZSkge1xyXG4gICAgICByZXR1cm4gc3RhcnRpbmdQcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzaG91bGRTdGFydCAmJiB0aGlzLl9zdGFydEZvckVkaXRvcih0ZXh0RWRpdG9yKSA/IGF3YWl0IHRoaXMuc3RhcnRTZXJ2ZXIoZmluYWxQcm9qZWN0UGF0aCkgOiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIHN0YXJ0U2VydmVyKHByb2plY3RQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEFjdGl2ZVNlcnZlcj4ge1xyXG4gICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RhcnRpbmcgXCIke3Byb2plY3RQYXRofVwiYCk7XHJcbiAgICBjb25zdCBzdGFydGluZ1Byb21pc2UgPSB0aGlzLl9zdGFydFNlcnZlcihwcm9qZWN0UGF0aCk7XHJcbiAgICB0aGlzLl9zdGFydGluZ1NlcnZlclByb21pc2VzLnNldChwcm9qZWN0UGF0aCwgc3RhcnRpbmdQcm9taXNlKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHN0YXJ0ZWRBY3RpdmVTZXJ2ZXIgPSBhd2FpdCBzdGFydGluZ1Byb21pc2U7XHJcbiAgICAgIHRoaXMuX2FjdGl2ZVNlcnZlcnMucHVzaChzdGFydGVkQWN0aXZlU2VydmVyKTtcclxuICAgICAgdGhpcy5fc3RhcnRpbmdTZXJ2ZXJQcm9taXNlcy5kZWxldGUocHJvamVjdFBhdGgpO1xyXG4gICAgICB0aGlzLl9sb2dnZXIuZGVidWcoYFNlcnZlciBzdGFydGVkIFwiJHtwcm9qZWN0UGF0aH1cIiAocGlkICR7c3RhcnRlZEFjdGl2ZVNlcnZlci5wcm9jZXNzLnBpZH0pYCk7XHJcbiAgICAgIHJldHVybiBzdGFydGVkQWN0aXZlU2VydmVyO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICB0aGlzLl9zdGFydGluZ1NlcnZlclByb21pc2VzLmRlbGV0ZShwcm9qZWN0UGF0aCk7XHJcbiAgICAgIHRocm93IGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc3RvcFVudXNlZFNlcnZlcnMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCB1c2VkU2VydmVycyA9IG5ldyBTZXQodGhpcy5fZWRpdG9yVG9TZXJ2ZXIudmFsdWVzKCkpO1xyXG4gICAgY29uc3QgdW51c2VkU2VydmVycyA9IHRoaXMuX2FjdGl2ZVNlcnZlcnMuZmlsdGVyKChzKSA9PiAhdXNlZFNlcnZlcnMuaGFzKHMpKTtcclxuICAgIGlmICh1bnVzZWRTZXJ2ZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTdG9wcGluZyAke3VudXNlZFNlcnZlcnMubGVuZ3RofSB1bnVzZWQgc2VydmVyc2ApO1xyXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCh1bnVzZWRTZXJ2ZXJzLm1hcCgocykgPT4gdGhpcy5zdG9wU2VydmVyKHMpKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc3RvcEFsbFNlcnZlcnMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBmb3IgKGNvbnN0IFtwcm9qZWN0UGF0aCwgcmVzdGFydENvdW50ZXJdIG9mIHRoaXMuX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQocmVzdGFydENvdW50ZXIudGltZXJJZCk7XHJcbiAgICAgIHRoaXMuX3Jlc3RhcnRDb3VudGVyUGVyUHJvamVjdC5kZWxldGUocHJvamVjdFBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGF3YWl0IFByb21pc2UuYWxsKHRoaXMuX2FjdGl2ZVNlcnZlcnMubWFwKChzKSA9PiB0aGlzLnN0b3BTZXJ2ZXIocykpKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyByZXN0YXJ0QWxsU2VydmVycygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHRoaXMuc3RvcExpc3RlbmluZygpO1xyXG4gICAgYXdhaXQgdGhpcy5zdG9wQWxsU2VydmVycygpO1xyXG4gICAgdGhpcy5fZWRpdG9yVG9TZXJ2ZXIgPSBuZXcgTWFwKCk7XHJcbiAgICB0aGlzLnN0YXJ0TGlzdGVuaW5nKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaGFzU2VydmVyUmVhY2hlZFJlc3RhcnRMaW1pdChzZXJ2ZXI6IEFjdGl2ZVNlcnZlcikge1xyXG4gICAgbGV0IHJlc3RhcnRDb3VudGVyID0gdGhpcy5fcmVzdGFydENvdW50ZXJQZXJQcm9qZWN0LmdldChzZXJ2ZXIucHJvamVjdFBhdGgpO1xyXG5cclxuICAgIGlmICghcmVzdGFydENvdW50ZXIpIHtcclxuICAgICAgcmVzdGFydENvdW50ZXIgPSB7XHJcbiAgICAgICAgcmVzdGFydHM6IDAsXHJcbiAgICAgICAgdGltZXJJZDogc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLl9yZXN0YXJ0Q291bnRlclBlclByb2plY3QuZGVsZXRlKHNlcnZlci5wcm9qZWN0UGF0aCk7XHJcbiAgICAgICAgfSwgMyAqIDYwICogMTAwMCAvKiAzIG1pbnV0ZXMgKi8pLFxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5fcmVzdGFydENvdW50ZXJQZXJQcm9qZWN0LnNldChzZXJ2ZXIucHJvamVjdFBhdGgsIHJlc3RhcnRDb3VudGVyKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKytyZXN0YXJ0Q291bnRlci5yZXN0YXJ0cyA+IDU7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgc3RvcFNlcnZlcihzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgYXdhaXQgdGhpcy5fcmVwb3J0QnVzeVdoaWxlKFxyXG4gICAgICBgU3RvcHBpbmcgJHt0aGlzLl9sYW5ndWFnZVNlcnZlck5hbWV9IGZvciAke3BhdGguYmFzZW5hbWUoc2VydmVyLnByb2plY3RQYXRoKX1gLFxyXG4gICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RvcHBpbmcgXCIke3NlcnZlci5wcm9qZWN0UGF0aH1cImApO1xyXG4gICAgICAgIC8vIEltbWVkaWF0ZWx5IHJlbW92ZSB0aGUgc2VydmVyIHRvIHByZXZlbnQgZnVydGhlciB1c2FnZS5cclxuICAgICAgICAvLyBJZiB3ZSByZS1vcGVuIHRoZSBmaWxlIGFmdGVyIHRoaXMgcG9pbnQsIHdlJ2xsIGdldCBhIG5ldyBzZXJ2ZXIuXHJcbiAgICAgICAgdGhpcy5fYWN0aXZlU2VydmVycy5zcGxpY2UodGhpcy5fYWN0aXZlU2VydmVycy5pbmRleE9mKHNlcnZlciksIDEpO1xyXG4gICAgICAgIHRoaXMuX3N0b3BwaW5nU2VydmVycy5wdXNoKHNlcnZlcik7XHJcbiAgICAgICAgc2VydmVyLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xyXG4gICAgICAgIGlmIChzZXJ2ZXIuY29ubmVjdGlvbi5pc0Nvbm5lY3RlZCkge1xyXG4gICAgICAgICAgYXdhaXQgc2VydmVyLmNvbm5lY3Rpb24uc2h1dGRvd24oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgW2VkaXRvciwgbWFwcGVkU2VydmVyXSBvZiB0aGlzLl9lZGl0b3JUb1NlcnZlcikge1xyXG4gICAgICAgICAgaWYgKG1hcHBlZFNlcnZlciA9PT0gc2VydmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvclRvU2VydmVyLmRlbGV0ZShlZGl0b3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5leGl0U2VydmVyKHNlcnZlcik7XHJcbiAgICAgICAgdGhpcy5fc3RvcHBpbmdTZXJ2ZXJzLnNwbGljZSh0aGlzLl9zdG9wcGluZ1NlcnZlcnMuaW5kZXhPZihzZXJ2ZXIpLCAxKTtcclxuICAgICAgfSxcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZXhpdFNlcnZlcihzZXJ2ZXI6IEFjdGl2ZVNlcnZlcik6IHZvaWQge1xyXG4gICAgY29uc3QgcGlkID0gc2VydmVyLnByb2Nlc3MucGlkO1xyXG4gICAgdHJ5IHtcclxuICAgICAgaWYgKHNlcnZlci5jb25uZWN0aW9uLmlzQ29ubmVjdGVkKSB7XHJcbiAgICAgICAgc2VydmVyLmNvbm5lY3Rpb24uZXhpdCgpO1xyXG4gICAgICAgIHNlcnZlci5jb25uZWN0aW9uLmRpc3Bvc2UoKTtcclxuICAgICAgfVxyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2VydmVyLnByb2Nlc3Mua2lsbCgpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgc3RvcHBlZCBcIiR7c2VydmVyLnByb2plY3RQYXRofVwiIChwaWQgJHtwaWR9KWApO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHRlcm1pbmF0ZSgpOiB2b2lkIHtcclxuICAgIHRoaXMuX3N0b3BwaW5nU2VydmVycy5mb3JFYWNoKChzZXJ2ZXIpID0+IHtcclxuICAgICAgdGhpcy5fbG9nZ2VyLmRlYnVnKGBTZXJ2ZXIgdGVybWluYXRpbmcgXCIke3NlcnZlci5wcm9qZWN0UGF0aH1cImApO1xyXG4gICAgICB0aGlzLmV4aXRTZXJ2ZXIoc2VydmVyKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGRldGVybWluZVByb2plY3RQYXRoKHRleHRFZGl0b3I6IFRleHRFZGl0b3IpOiBzdHJpbmcgfCBudWxsIHtcclxuICAgIGNvbnN0IGZpbGVQYXRoID0gdGV4dEVkaXRvci5nZXRQYXRoKCk7XHJcbiAgICBpZiAoZmlsZVBhdGggPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9ub3JtYWxpemVkUHJvamVjdFBhdGhzLmZpbmQoKGQpID0+IGZpbGVQYXRoLnN0YXJ0c1dpdGgoZCkpIHx8IG51bGw7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgdXBkYXRlTm9ybWFsaXplZFByb2plY3RQYXRocygpOiB2b2lkIHtcclxuICAgIHRoaXMuX25vcm1hbGl6ZWRQcm9qZWN0UGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5tYXAoKGQpID0+IHRoaXMubm9ybWFsaXplUGF0aChkLmdldFBhdGgoKSkpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG5vcm1hbGl6ZVBhdGgocHJvamVjdFBhdGg6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gIXByb2plY3RQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSA/IHBhdGguam9pbihwcm9qZWN0UGF0aCwgcGF0aC5zZXApIDogcHJvamVjdFBhdGg7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgcHJvamVjdFBhdGhzQ2hhbmdlZChwcm9qZWN0UGF0aHM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBwYXRoc1NldCA9IG5ldyBTZXQocHJvamVjdFBhdGhzLm1hcCh0aGlzLm5vcm1hbGl6ZVBhdGgpKTtcclxuICAgIGNvbnN0IHNlcnZlcnNUb1N0b3AgPSB0aGlzLl9hY3RpdmVTZXJ2ZXJzLmZpbHRlcigocykgPT4gIXBhdGhzU2V0LmhhcyhzLnByb2plY3RQYXRoKSk7XHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChzZXJ2ZXJzVG9TdG9wLm1hcCgocykgPT4gdGhpcy5zdG9wU2VydmVyKHMpKSk7XHJcbiAgICB0aGlzLnVwZGF0ZU5vcm1hbGl6ZWRQcm9qZWN0UGF0aHMoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwcm9qZWN0RmlsZXNDaGFuZ2VkKGZpbGVFdmVudHM6IEZpbGVzeXN0ZW1DaGFuZ2VFdmVudCk6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuX2FjdGl2ZVNlcnZlcnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IGFjdGl2ZVNlcnZlciBvZiB0aGlzLl9hY3RpdmVTZXJ2ZXJzKSB7XHJcbiAgICAgIGNvbnN0IGNoYW5nZXM6IGxzLkZpbGVFdmVudFtdID0gW107XHJcbiAgICAgIGZvciAoY29uc3QgZmlsZUV2ZW50IG9mIGZpbGVFdmVudHMpIHtcclxuICAgICAgICBpZiAoZmlsZUV2ZW50LnBhdGguc3RhcnRzV2l0aChhY3RpdmVTZXJ2ZXIucHJvamVjdFBhdGgpICYmIHRoaXMuX2NoYW5nZVdhdGNoZWRGaWxlRmlsdGVyKGZpbGVFdmVudC5wYXRoKSkge1xyXG4gICAgICAgICAgY2hhbmdlcy5wdXNoKENvbnZlcnQuYXRvbUZpbGVFdmVudFRvTFNGaWxlRXZlbnRzKGZpbGVFdmVudClbMF0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBmaWxlRXZlbnQuYWN0aW9uID09PSAncmVuYW1lZCcgJiZcclxuICAgICAgICAgIGZpbGVFdmVudC5vbGRQYXRoLnN0YXJ0c1dpdGgoYWN0aXZlU2VydmVyLnByb2plY3RQYXRoKSAmJlxyXG4gICAgICAgICAgdGhpcy5fY2hhbmdlV2F0Y2hlZEZpbGVGaWx0ZXIoZmlsZUV2ZW50Lm9sZFBhdGgpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICBjaGFuZ2VzLnB1c2goQ29udmVydC5hdG9tRmlsZUV2ZW50VG9MU0ZpbGVFdmVudHMoZmlsZUV2ZW50KVsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChjaGFuZ2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBhY3RpdmVTZXJ2ZXIuY29ubmVjdGlvbi5kaWRDaGFuZ2VXYXRjaGVkRmlsZXMoe2NoYW5nZXN9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=

/***/ }),

/***/ "./node_modules/atom-languageclient/build/lib/utils.js":
/*!*************************************************************!*\
  !*** ./node_modules/atom-languageclient/build/lib/utils.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'atom'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/vscode-jsonrpc/lib/main.js");
/**
 * Obtain the range of the word at the given editor position.
 * Uses the non-word characters from the position's grammar scope.
 */
function getWordAtPosition(editor, position) {
    const nonWordCharacters = escapeRegExp(editor.getNonWordCharacters(position));
    const range = _getRegexpRangeAtPosition(editor.getBuffer(), position, new RegExp(`^[\t ]*$|[^\\s${nonWordCharacters}]+`, 'g'));
    if (range == null) {
        return new atom_1.Range(position, position);
    }
    return range;
}
exports.getWordAtPosition = getWordAtPosition;
function escapeRegExp(string) {
    // From atom/underscore-plus.
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
exports.escapeRegExp = escapeRegExp;
function _getRegexpRangeAtPosition(buffer, position, wordRegex) {
    const { row, column } = position;
    const rowRange = buffer.rangeForRow(row, false);
    let matchData;
    // Extract the expression from the row text.
    buffer.scanInRange(wordRegex, rowRange, (data) => {
        const { range } = data;
        if (position.isGreaterThanOrEqual(range.start) &&
            // Range endpoints are exclusive.
            position.isLessThan(range.end)) {
            matchData = data;
            data.stop();
            return;
        }
        // Stop the scan if the scanner has passed our position.
        if (range.end.column > column) {
            data.stop();
        }
    });
    return matchData == null ? null : matchData.range;
}
/**
 * For the given connection and cancellationTokens map, cancel the existing
 * CancellationToken for that connection then create and store a new
 * CancellationToken to be used for the current request.
 */
function cancelAndRefreshCancellationToken(key, cancellationTokens) {
    let cancellationToken = cancellationTokens.get(key);
    if (cancellationToken !== undefined && !cancellationToken.token.isCancellationRequested) {
        cancellationToken.cancel();
    }
    cancellationToken = new vscode_jsonrpc_1.CancellationTokenSource();
    cancellationTokens.set(key, cancellationToken);
    return cancellationToken.token;
}
exports.cancelAndRefreshCancellationToken = cancelAndRefreshCancellationToken;
function doWithCancellationToken(key, cancellationTokens, work) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = cancelAndRefreshCancellationToken(key, cancellationTokens);
        const result = yield work(token);
        cancellationTokens.delete(key);
        return result;
    });
}
exports.doWithCancellationToken = doWithCancellationToken;
function assertUnreachable(_) {
    return _;
}
exports.assertUnreachable = assertUnreachable;
function promiseWithTimeout(ms, promise) {
    return new Promise((resolve, reject) => {
        // create a timeout to reject promise if not resolved
        const timer = setTimeout(() => {
            reject(new Error(`Timeout after ${ms}ms`));
        }, ms);
        promise.then((res) => {
            clearTimeout(timer);
            resolve(res);
        }).catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
exports.promiseWithTimeout = promiseWithTimeout;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQU1jO0FBQ2QsbURBR3dCO0FBT3hCOzs7R0FHRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLE1BQWtCLEVBQUUsUUFBZTtJQUNuRSxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM5RSxNQUFNLEtBQUssR0FBRyx5QkFBeUIsQ0FDckMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUNsQixRQUFRLEVBQ1IsSUFBSSxNQUFNLENBQUMsaUJBQWlCLGlCQUFpQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQ3hELENBQUM7SUFDRixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsT0FBTyxJQUFJLFlBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDdEM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFYRCw4Q0FXQztBQUVELFNBQWdCLFlBQVksQ0FBQyxNQUFjO0lBQ3pDLDZCQUE2QjtJQUM3QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUhELG9DQUdDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxNQUFrQixFQUFFLFFBQWUsRUFBRSxTQUFpQjtJQUN2RixNQUFNLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBQyxHQUFHLFFBQVEsQ0FBQztJQUMvQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxJQUFJLFNBQThDLENBQUM7SUFDbkQsNENBQTRDO0lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQy9DLE1BQU0sRUFBQyxLQUFLLEVBQUMsR0FBRyxJQUFJLENBQUM7UUFDckIsSUFDRSxRQUFRLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUMxQyxpQ0FBaUM7WUFDakMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQzlCO1lBQ0EsU0FBUyxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixPQUFPO1NBQ1I7UUFDRCx3REFBd0Q7UUFDeEQsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLEVBQUU7WUFDN0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2I7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3BELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsaUNBQWlDLENBQy9DLEdBQU0sRUFDTixrQkFBdUQ7SUFFdkQsSUFBSSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEQsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUU7UUFDdkYsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7S0FDNUI7SUFFRCxpQkFBaUIsR0FBRyxJQUFJLHdDQUF1QixFQUFFLENBQUM7SUFDbEQsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQy9DLE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDO0FBQ2pDLENBQUM7QUFaRCw4RUFZQztBQUVELFNBQXNCLHVCQUF1QixDQUMzQyxHQUFPLEVBQ1Asa0JBQXdELEVBQ3hELElBQStDOztRQUUvQyxNQUFNLEtBQUssR0FBRyxpQ0FBaUMsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUN6RSxNQUFNLE1BQU0sR0FBTyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUFBO0FBVEQsMERBU0M7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxDQUFRO0lBQ3hDLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUksRUFBVSxFQUFFLE9BQW1CO0lBQ25FLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMscURBQXFEO1FBQ3JELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDNUIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRVAsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ25CLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNmLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQWZELGdEQWVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBQb2ludCxcclxuICBUZXh0QnVmZmVyLFxyXG4gIFRleHRFZGl0b3IsXHJcbiAgUmFuZ2UsXHJcbiAgQnVmZmVyU2NhblJlc3VsdCxcclxufSBmcm9tICdhdG9tJztcclxuaW1wb3J0IHtcclxuICBDYW5jZWxsYXRpb25Ub2tlbixcclxuICBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSxcclxufSBmcm9tICd2c2NvZGUtanNvbnJwYyc7XHJcblxyXG5leHBvcnQgdHlwZSBSZXBvcnRCdXN5V2hpbGUgPSA8VD4oXHJcbiAgdGl0bGU6IHN0cmluZyxcclxuICBmOiAoKSA9PiBQcm9taXNlPFQ+LFxyXG4pID0+IFByb21pc2U8VD47XHJcblxyXG4vKipcclxuICogT2J0YWluIHRoZSByYW5nZSBvZiB0aGUgd29yZCBhdCB0aGUgZ2l2ZW4gZWRpdG9yIHBvc2l0aW9uLlxyXG4gKiBVc2VzIHRoZSBub24td29yZCBjaGFyYWN0ZXJzIGZyb20gdGhlIHBvc2l0aW9uJ3MgZ3JhbW1hciBzY29wZS5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3JkQXRQb3NpdGlvbihlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFJhbmdlIHtcclxuICBjb25zdCBub25Xb3JkQ2hhcmFjdGVycyA9IGVzY2FwZVJlZ0V4cChlZGl0b3IuZ2V0Tm9uV29yZENoYXJhY3RlcnMocG9zaXRpb24pKTtcclxuICBjb25zdCByYW5nZSA9IF9nZXRSZWdleHBSYW5nZUF0UG9zaXRpb24oXHJcbiAgICBlZGl0b3IuZ2V0QnVmZmVyKCksXHJcbiAgICBwb3NpdGlvbixcclxuICAgIG5ldyBSZWdFeHAoYF5bXFx0IF0qJHxbXlxcXFxzJHtub25Xb3JkQ2hhcmFjdGVyc31dK2AsICdnJyksXHJcbiAgKTtcclxuICBpZiAocmFuZ2UgPT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIG5ldyBSYW5nZShwb3NpdGlvbiwgcG9zaXRpb24pO1xyXG4gIH1cclxuICByZXR1cm4gcmFuZ2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVSZWdFeHAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIC8vIEZyb20gYXRvbS91bmRlcnNjb3JlLXBsdXMuXHJcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLS9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIF9nZXRSZWdleHBSYW5nZUF0UG9zaXRpb24oYnVmZmVyOiBUZXh0QnVmZmVyLCBwb3NpdGlvbjogUG9pbnQsIHdvcmRSZWdleDogUmVnRXhwKTogUmFuZ2UgfCBudWxsIHtcclxuICBjb25zdCB7cm93LCBjb2x1bW59ID0gcG9zaXRpb247XHJcbiAgY29uc3Qgcm93UmFuZ2UgPSBidWZmZXIucmFuZ2VGb3JSb3cocm93LCBmYWxzZSk7XHJcbiAgbGV0IG1hdGNoRGF0YTogQnVmZmVyU2NhblJlc3VsdCB8IHVuZGVmaW5lZCB8IG51bGw7XHJcbiAgLy8gRXh0cmFjdCB0aGUgZXhwcmVzc2lvbiBmcm9tIHRoZSByb3cgdGV4dC5cclxuICBidWZmZXIuc2NhbkluUmFuZ2Uod29yZFJlZ2V4LCByb3dSYW5nZSwgKGRhdGEpID0+IHtcclxuICAgIGNvbnN0IHtyYW5nZX0gPSBkYXRhO1xyXG4gICAgaWYgKFxyXG4gICAgICBwb3NpdGlvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbChyYW5nZS5zdGFydCkgJiZcclxuICAgICAgLy8gUmFuZ2UgZW5kcG9pbnRzIGFyZSBleGNsdXNpdmUuXHJcbiAgICAgIHBvc2l0aW9uLmlzTGVzc1RoYW4ocmFuZ2UuZW5kKVxyXG4gICAgKSB7XHJcbiAgICAgIG1hdGNoRGF0YSA9IGRhdGE7XHJcbiAgICAgIGRhdGEuc3RvcCgpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvLyBTdG9wIHRoZSBzY2FuIGlmIHRoZSBzY2FubmVyIGhhcyBwYXNzZWQgb3VyIHBvc2l0aW9uLlxyXG4gICAgaWYgKHJhbmdlLmVuZC5jb2x1bW4gPiBjb2x1bW4pIHtcclxuICAgICAgZGF0YS5zdG9wKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIG1hdGNoRGF0YSA9PSBudWxsID8gbnVsbCA6IG1hdGNoRGF0YS5yYW5nZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZvciB0aGUgZ2l2ZW4gY29ubmVjdGlvbiBhbmQgY2FuY2VsbGF0aW9uVG9rZW5zIG1hcCwgY2FuY2VsIHRoZSBleGlzdGluZ1xyXG4gKiBDYW5jZWxsYXRpb25Ub2tlbiBmb3IgdGhhdCBjb25uZWN0aW9uIHRoZW4gY3JlYXRlIGFuZCBzdG9yZSBhIG5ld1xyXG4gKiBDYW5jZWxsYXRpb25Ub2tlbiB0byBiZSB1c2VkIGZvciB0aGUgY3VycmVudCByZXF1ZXN0LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbmNlbEFuZFJlZnJlc2hDYW5jZWxsYXRpb25Ub2tlbjxUIGV4dGVuZHMgb2JqZWN0PihcclxuICBrZXk6IFQsXHJcbiAgY2FuY2VsbGF0aW9uVG9rZW5zOiBXZWFrTWFwPFQsIENhbmNlbGxhdGlvblRva2VuU291cmNlPik6IENhbmNlbGxhdGlvblRva2VuIHtcclxuXHJcbiAgbGV0IGNhbmNlbGxhdGlvblRva2VuID0gY2FuY2VsbGF0aW9uVG9rZW5zLmdldChrZXkpO1xyXG4gIGlmIChjYW5jZWxsYXRpb25Ub2tlbiAhPT0gdW5kZWZpbmVkICYmICFjYW5jZWxsYXRpb25Ub2tlbi50b2tlbi5pc0NhbmNlbGxhdGlvblJlcXVlc3RlZCkge1xyXG4gICAgY2FuY2VsbGF0aW9uVG9rZW4uY2FuY2VsKCk7XHJcbiAgfVxyXG5cclxuICBjYW5jZWxsYXRpb25Ub2tlbiA9IG5ldyBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSgpO1xyXG4gIGNhbmNlbGxhdGlvblRva2Vucy5zZXQoa2V5LCBjYW5jZWxsYXRpb25Ub2tlbik7XHJcbiAgcmV0dXJuIGNhbmNlbGxhdGlvblRva2VuLnRva2VuO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG9XaXRoQ2FuY2VsbGF0aW9uVG9rZW48VDEgZXh0ZW5kcyBvYmplY3QsIFQyPihcclxuICBrZXk6IFQxLFxyXG4gIGNhbmNlbGxhdGlvblRva2VuczogV2Vha01hcDxUMSwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+LFxyXG4gIHdvcms6ICh0b2tlbjogQ2FuY2VsbGF0aW9uVG9rZW4pID0+IFByb21pc2U8VDI+LFxyXG4pOiBQcm9taXNlPFQyPiB7XHJcbiAgY29uc3QgdG9rZW4gPSBjYW5jZWxBbmRSZWZyZXNoQ2FuY2VsbGF0aW9uVG9rZW4oa2V5LCBjYW5jZWxsYXRpb25Ub2tlbnMpO1xyXG4gIGNvbnN0IHJlc3VsdDogVDIgPSBhd2FpdCB3b3JrKHRva2VuKTtcclxuICBjYW5jZWxsYXRpb25Ub2tlbnMuZGVsZXRlKGtleSk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFVucmVhY2hhYmxlKF86IG5ldmVyKTogbmV2ZXIge1xyXG4gIHJldHVybiBfO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvbWlzZVdpdGhUaW1lb3V0PFQ+KG1zOiBudW1iZXIsIHByb21pc2U6IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgLy8gY3JlYXRlIGEgdGltZW91dCB0byByZWplY3QgcHJvbWlzZSBpZiBub3QgcmVzb2x2ZWRcclxuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYFRpbWVvdXQgYWZ0ZXIgJHttc31tc2ApKTtcclxuICAgIH0sIG1zKTtcclxuXHJcbiAgICBwcm9taXNlLnRoZW4oKHJlcykgPT4ge1xyXG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICByZXNvbHZlKHJlcyk7XHJcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuIl19

/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/main.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/main.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
exports.ErrorCodes = vscode_jsonrpc_1.ErrorCodes;
exports.ResponseError = vscode_jsonrpc_1.ResponseError;
exports.CancellationToken = vscode_jsonrpc_1.CancellationToken;
exports.CancellationTokenSource = vscode_jsonrpc_1.CancellationTokenSource;
exports.Disposable = vscode_jsonrpc_1.Disposable;
exports.Event = vscode_jsonrpc_1.Event;
exports.Emitter = vscode_jsonrpc_1.Emitter;
exports.Trace = vscode_jsonrpc_1.Trace;
exports.SetTraceNotification = vscode_jsonrpc_1.SetTraceNotification;
exports.LogTraceNotification = vscode_jsonrpc_1.LogTraceNotification;
exports.RequestType = vscode_jsonrpc_1.RequestType;
exports.RequestType0 = vscode_jsonrpc_1.RequestType0;
exports.NotificationType = vscode_jsonrpc_1.NotificationType;
exports.NotificationType0 = vscode_jsonrpc_1.NotificationType0;
exports.MessageReader = vscode_jsonrpc_1.MessageReader;
exports.MessageWriter = vscode_jsonrpc_1.MessageWriter;
exports.ConnectionStrategy = vscode_jsonrpc_1.ConnectionStrategy;
exports.StreamMessageReader = vscode_jsonrpc_1.StreamMessageReader;
exports.StreamMessageWriter = vscode_jsonrpc_1.StreamMessageWriter;
exports.IPCMessageReader = vscode_jsonrpc_1.IPCMessageReader;
exports.IPCMessageWriter = vscode_jsonrpc_1.IPCMessageWriter;
exports.createClientPipeTransport = vscode_jsonrpc_1.createClientPipeTransport;
exports.createServerPipeTransport = vscode_jsonrpc_1.createServerPipeTransport;
exports.generateRandomPipeName = vscode_jsonrpc_1.generateRandomPipeName;
exports.createClientSocketTransport = vscode_jsonrpc_1.createClientSocketTransport;
exports.createServerSocketTransport = vscode_jsonrpc_1.createServerSocketTransport;
__export(__webpack_require__(/*! vscode-languageserver-types */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-types/lib/esm/main.js"));
__export(__webpack_require__(/*! ./protocol */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.js"));
function createProtocolConnection(reader, writer, logger, strategy) {
    return vscode_jsonrpc_1.createMessageConnection(reader, writer, logger, strategy);
}
exports.createProtocolConnection = createProtocolConnection;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.colorProvider.js":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.colorProvider.js ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
/**
 * A request to list all color symbols found in a given text document. The request's
 * parameter is of type [DocumentColorParams](#DocumentColorParams) the
 * response is of type [ColorInformation[]](#ColorInformation) or a Thenable
 * that resolves to such.
 */
var DocumentColorRequest;
(function (DocumentColorRequest) {
    DocumentColorRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/documentColor');
})(DocumentColorRequest = exports.DocumentColorRequest || (exports.DocumentColorRequest = {}));
/**
 * A request to list all presentation for a color. The request's
 * parameter is of type [ColorPresentationParams](#ColorPresentationParams) the
 * response is of type [ColorInformation[]](#ColorInformation) or a Thenable
 * that resolves to such.
 */
var ColorPresentationRequest;
(function (ColorPresentationRequest) {
    ColorPresentationRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/colorPresentation');
})(ColorPresentationRequest = exports.ColorPresentationRequest || (exports.ColorPresentationRequest = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.configuration.js":
/*!********************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.configuration.js ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
/**
 * The 'workspace/configuration' request is sent from the server to the client to fetch a certain
 * configuration setting.
 */
var ConfigurationRequest;
(function (ConfigurationRequest) {
    ConfigurationRequest.type = new vscode_jsonrpc_1.RequestType('workspace/configuration');
})(ConfigurationRequest = exports.ConfigurationRequest || (exports.ConfigurationRequest = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.foldingRange.js":
/*!*******************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.foldingRange.js ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
/**
 * Enum of known range kinds
 */
var FoldingRangeKind;
(function (FoldingRangeKind) {
    /**
     * Folding range for a comment
     */
    FoldingRangeKind["Comment"] = "comment";
    /**
     * Folding range for a imports or includes
     */
    FoldingRangeKind["Imports"] = "imports";
    /**
     * Folding range for a region (e.g. `#region`)
     */
    FoldingRangeKind["Region"] = "region";
})(FoldingRangeKind = exports.FoldingRangeKind || (exports.FoldingRangeKind = {}));
/**
 * A request to provide folding ranges in a document. The request's
 * parameter is of type [FoldingRangeRequestParam](#FoldingRangeRequestParam), the
 * response is of type [FoldingRangeList](#FoldingRangeList) or a Thenable
 * that resolves to such.
 */
var FoldingRangeRequest;
(function (FoldingRangeRequest) {
    FoldingRangeRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/foldingRange');
})(FoldingRangeRequest = exports.FoldingRangeRequest || (exports.FoldingRangeRequest = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.implementation.js":
/*!*********************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.implementation.js ***!
  \*********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
/**
 * A request to resolve the implementation locations of a symbol at a given text
 * document position. The request's parameter is of type [TextDocumentPositioParams]
 * (#TextDocumentPositionParams) the response is of type [Definition](#Definition) or a
 * Thenable that resolves to such.
 */
var ImplementationRequest;
(function (ImplementationRequest) {
    ImplementationRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/implementation');
})(ImplementationRequest = exports.ImplementationRequest || (exports.ImplementationRequest = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const Is = __webpack_require__(/*! ./utils/is */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/utils/is.js");
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
const protocol_implementation_1 = __webpack_require__(/*! ./protocol.implementation */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.implementation.js");
exports.ImplementationRequest = protocol_implementation_1.ImplementationRequest;
const protocol_typeDefinition_1 = __webpack_require__(/*! ./protocol.typeDefinition */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.typeDefinition.js");
exports.TypeDefinitionRequest = protocol_typeDefinition_1.TypeDefinitionRequest;
const protocol_workspaceFolders_1 = __webpack_require__(/*! ./protocol.workspaceFolders */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.workspaceFolders.js");
exports.WorkspaceFoldersRequest = protocol_workspaceFolders_1.WorkspaceFoldersRequest;
exports.DidChangeWorkspaceFoldersNotification = protocol_workspaceFolders_1.DidChangeWorkspaceFoldersNotification;
const protocol_configuration_1 = __webpack_require__(/*! ./protocol.configuration */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.configuration.js");
exports.ConfigurationRequest = protocol_configuration_1.ConfigurationRequest;
const protocol_colorProvider_1 = __webpack_require__(/*! ./protocol.colorProvider */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.colorProvider.js");
exports.DocumentColorRequest = protocol_colorProvider_1.DocumentColorRequest;
exports.ColorPresentationRequest = protocol_colorProvider_1.ColorPresentationRequest;
const protocol_foldingRange_1 = __webpack_require__(/*! ./protocol.foldingRange */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.foldingRange.js");
exports.FoldingRangeRequest = protocol_foldingRange_1.FoldingRangeRequest;
var DocumentFilter;
(function (DocumentFilter) {
    function is(value) {
        let candidate = value;
        return Is.string(candidate.language) || Is.string(candidate.scheme) || Is.string(candidate.pattern);
    }
    DocumentFilter.is = is;
})(DocumentFilter = exports.DocumentFilter || (exports.DocumentFilter = {}));
/**
 * The `client/registerCapability` request is sent from the server to the client to register a new capability
 * handler on the client side.
 */
var RegistrationRequest;
(function (RegistrationRequest) {
    RegistrationRequest.type = new vscode_jsonrpc_1.RequestType('client/registerCapability');
})(RegistrationRequest = exports.RegistrationRequest || (exports.RegistrationRequest = {}));
/**
 * The `client/unregisterCapability` request is sent from the server to the client to unregister a previously registered capability
 * handler on the client side.
 */
var UnregistrationRequest;
(function (UnregistrationRequest) {
    UnregistrationRequest.type = new vscode_jsonrpc_1.RequestType('client/unregisterCapability');
})(UnregistrationRequest = exports.UnregistrationRequest || (exports.UnregistrationRequest = {}));
/**
 * Defines how the host (editor) should sync
 * document changes to the language server.
 */
var TextDocumentSyncKind;
(function (TextDocumentSyncKind) {
    /**
     * Documents should not be synced at all.
     */
    TextDocumentSyncKind.None = 0;
    /**
     * Documents are synced by always sending the full content
     * of the document.
     */
    TextDocumentSyncKind.Full = 1;
    /**
     * Documents are synced by sending the full content on open.
     * After that only incremental updates to the document are
     * send.
     */
    TextDocumentSyncKind.Incremental = 2;
})(TextDocumentSyncKind = exports.TextDocumentSyncKind || (exports.TextDocumentSyncKind = {}));
/**
 * The initialize request is sent from the client to the server.
 * It is sent once as the request after starting up the server.
 * The requests parameter is of type [InitializeParams](#InitializeParams)
 * the response if of type [InitializeResult](#InitializeResult) of a Thenable that
 * resolves to such.
 */
var InitializeRequest;
(function (InitializeRequest) {
    InitializeRequest.type = new vscode_jsonrpc_1.RequestType('initialize');
})(InitializeRequest = exports.InitializeRequest || (exports.InitializeRequest = {}));
/**
 * Known error codes for an `InitializeError`;
 */
var InitializeError;
(function (InitializeError) {
    /**
     * If the protocol version provided by the client can't be handled by the server.
     * @deprecated This initialize error got replaced by client capabilities. There is
     * no version handshake in version 3.0x
     */
    InitializeError.unknownProtocolVersion = 1;
})(InitializeError = exports.InitializeError || (exports.InitializeError = {}));
/**
 * The intialized notification is sent from the client to the
 * server after the client is fully initialized and the server
 * is allowed to send requests from the server to the client.
 */
var InitializedNotification;
(function (InitializedNotification) {
    InitializedNotification.type = new vscode_jsonrpc_1.NotificationType('initialized');
})(InitializedNotification = exports.InitializedNotification || (exports.InitializedNotification = {}));
//---- Shutdown Method ----
/**
 * A shutdown request is sent from the client to the server.
 * It is sent once when the client decides to shutdown the
 * server. The only notification that is sent after a shutdown request
 * is the exit event.
 */
var ShutdownRequest;
(function (ShutdownRequest) {
    ShutdownRequest.type = new vscode_jsonrpc_1.RequestType0('shutdown');
})(ShutdownRequest = exports.ShutdownRequest || (exports.ShutdownRequest = {}));
//---- Exit Notification ----
/**
 * The exit event is sent from the client to the server to
 * ask the server to exit its process.
 */
var ExitNotification;
(function (ExitNotification) {
    ExitNotification.type = new vscode_jsonrpc_1.NotificationType0('exit');
})(ExitNotification = exports.ExitNotification || (exports.ExitNotification = {}));
//---- Configuration notification ----
/**
 * The configuration change notification is sent from the client to the server
 * when the client's configuration has changed. The notification contains
 * the changed configuration as defined by the language client.
 */
var DidChangeConfigurationNotification;
(function (DidChangeConfigurationNotification) {
    DidChangeConfigurationNotification.type = new vscode_jsonrpc_1.NotificationType('workspace/didChangeConfiguration');
})(DidChangeConfigurationNotification = exports.DidChangeConfigurationNotification || (exports.DidChangeConfigurationNotification = {}));
//---- Message show and log notifications ----
/**
 * The message type
 */
var MessageType;
(function (MessageType) {
    /**
     * An error message.
     */
    MessageType.Error = 1;
    /**
     * A warning message.
     */
    MessageType.Warning = 2;
    /**
     * An information message.
     */
    MessageType.Info = 3;
    /**
     * A log message.
     */
    MessageType.Log = 4;
})(MessageType = exports.MessageType || (exports.MessageType = {}));
/**
 * The show message notification is sent from a server to a client to ask
 * the client to display a particular message in the user interface.
 */
var ShowMessageNotification;
(function (ShowMessageNotification) {
    ShowMessageNotification.type = new vscode_jsonrpc_1.NotificationType('window/showMessage');
})(ShowMessageNotification = exports.ShowMessageNotification || (exports.ShowMessageNotification = {}));
/**
 * The show message request is sent from the server to the client to show a message
 * and a set of options actions to the user.
 */
var ShowMessageRequest;
(function (ShowMessageRequest) {
    ShowMessageRequest.type = new vscode_jsonrpc_1.RequestType('window/showMessageRequest');
})(ShowMessageRequest = exports.ShowMessageRequest || (exports.ShowMessageRequest = {}));
/**
 * The log message notification is sent from the server to the client to ask
 * the client to log a particular message.
 */
var LogMessageNotification;
(function (LogMessageNotification) {
    LogMessageNotification.type = new vscode_jsonrpc_1.NotificationType('window/logMessage');
})(LogMessageNotification = exports.LogMessageNotification || (exports.LogMessageNotification = {}));
//---- Telemetry notification
/**
 * The telemetry event notification is sent from the server to the client to ask
 * the client to log telemetry data.
 */
var TelemetryEventNotification;
(function (TelemetryEventNotification) {
    TelemetryEventNotification.type = new vscode_jsonrpc_1.NotificationType('telemetry/event');
})(TelemetryEventNotification = exports.TelemetryEventNotification || (exports.TelemetryEventNotification = {}));
/**
 * The document open notification is sent from the client to the server to signal
 * newly opened text documents. The document's truth is now managed by the client
 * and the server must not try to read the document's truth using the document's
 * uri. Open in this sense means it is managed by the client. It doesn't necessarily
 * mean that its content is presented in an editor. An open notification must not
 * be sent more than once without a corresponding close notification send before.
 * This means open and close notification must be balanced and the max open count
 * is one.
 */
var DidOpenTextDocumentNotification;
(function (DidOpenTextDocumentNotification) {
    DidOpenTextDocumentNotification.type = new vscode_jsonrpc_1.NotificationType('textDocument/didOpen');
})(DidOpenTextDocumentNotification = exports.DidOpenTextDocumentNotification || (exports.DidOpenTextDocumentNotification = {}));
/**
 * The document change notification is sent from the client to the server to signal
 * changes to a text document.
 */
var DidChangeTextDocumentNotification;
(function (DidChangeTextDocumentNotification) {
    DidChangeTextDocumentNotification.type = new vscode_jsonrpc_1.NotificationType('textDocument/didChange');
})(DidChangeTextDocumentNotification = exports.DidChangeTextDocumentNotification || (exports.DidChangeTextDocumentNotification = {}));
/**
 * The document close notification is sent from the client to the server when
 * the document got closed in the client. The document's truth now exists where
 * the document's uri points to (e.g. if the document's uri is a file uri the
 * truth now exists on disk). As with the open notification the close notification
 * is about managing the document's content. Receiving a close notification
 * doesn't mean that the document was open in an editor before. A close
 * notification requires a previous open notification to be sent.
 */
var DidCloseTextDocumentNotification;
(function (DidCloseTextDocumentNotification) {
    DidCloseTextDocumentNotification.type = new vscode_jsonrpc_1.NotificationType('textDocument/didClose');
})(DidCloseTextDocumentNotification = exports.DidCloseTextDocumentNotification || (exports.DidCloseTextDocumentNotification = {}));
/**
 * The document save notification is sent from the client to the server when
 * the document got saved in the client.
 */
var DidSaveTextDocumentNotification;
(function (DidSaveTextDocumentNotification) {
    DidSaveTextDocumentNotification.type = new vscode_jsonrpc_1.NotificationType('textDocument/didSave');
})(DidSaveTextDocumentNotification = exports.DidSaveTextDocumentNotification || (exports.DidSaveTextDocumentNotification = {}));
/**
 * A document will save notification is sent from the client to the server before
 * the document is actually saved.
 */
var WillSaveTextDocumentNotification;
(function (WillSaveTextDocumentNotification) {
    WillSaveTextDocumentNotification.type = new vscode_jsonrpc_1.NotificationType('textDocument/willSave');
})(WillSaveTextDocumentNotification = exports.WillSaveTextDocumentNotification || (exports.WillSaveTextDocumentNotification = {}));
/**
 * A document will save request is sent from the client to the server before
 * the document is actually saved. The request can return an array of TextEdits
 * which will be applied to the text document before it is saved. Please note that
 * clients might drop results if computing the text edits took too long or if a
 * server constantly fails on this request. This is done to keep the save fast and
 * reliable.
 */
var WillSaveTextDocumentWaitUntilRequest;
(function (WillSaveTextDocumentWaitUntilRequest) {
    WillSaveTextDocumentWaitUntilRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/willSaveWaitUntil');
})(WillSaveTextDocumentWaitUntilRequest = exports.WillSaveTextDocumentWaitUntilRequest || (exports.WillSaveTextDocumentWaitUntilRequest = {}));
//---- File eventing ----
/**
 * The watched files notification is sent from the client to the server when
 * the client detects changes to file watched by the language client.
 */
var DidChangeWatchedFilesNotification;
(function (DidChangeWatchedFilesNotification) {
    DidChangeWatchedFilesNotification.type = new vscode_jsonrpc_1.NotificationType('workspace/didChangeWatchedFiles');
})(DidChangeWatchedFilesNotification = exports.DidChangeWatchedFilesNotification || (exports.DidChangeWatchedFilesNotification = {}));
/**
 * The file event type
 */
var FileChangeType;
(function (FileChangeType) {
    /**
     * The file got created.
     */
    FileChangeType.Created = 1;
    /**
     * The file got changed.
     */
    FileChangeType.Changed = 2;
    /**
     * The file got deleted.
     */
    FileChangeType.Deleted = 3;
})(FileChangeType = exports.FileChangeType || (exports.FileChangeType = {}));
var WatchKind;
(function (WatchKind) {
    /**
     * Interested in create events.
     */
    WatchKind.Create = 1;
    /**
     * Interested in change events
     */
    WatchKind.Change = 2;
    /**
     * Interested in delete events
     */
    WatchKind.Delete = 4;
})(WatchKind = exports.WatchKind || (exports.WatchKind = {}));
//---- Diagnostic notification ----
/**
 * Diagnostics notification are sent from the server to the client to signal
 * results of validation runs.
 */
var PublishDiagnosticsNotification;
(function (PublishDiagnosticsNotification) {
    PublishDiagnosticsNotification.type = new vscode_jsonrpc_1.NotificationType('textDocument/publishDiagnostics');
})(PublishDiagnosticsNotification = exports.PublishDiagnosticsNotification || (exports.PublishDiagnosticsNotification = {}));
/**
 * How a completion was triggered
 */
var CompletionTriggerKind;
(function (CompletionTriggerKind) {
    /**
     * Completion was triggered by typing an identifier (24x7 code
     * complete), manual invocation (e.g Ctrl+Space) or via API.
     */
    CompletionTriggerKind.Invoked = 1;
    /**
     * Completion was triggered by a trigger character specified by
     * the `triggerCharacters` properties of the `CompletionRegistrationOptions`.
     */
    CompletionTriggerKind.TriggerCharacter = 2;
    /**
     * Completion was re-triggered as current completion list is incomplete
     */
    CompletionTriggerKind.TriggerForIncompleteCompletions = 3;
})(CompletionTriggerKind = exports.CompletionTriggerKind || (exports.CompletionTriggerKind = {}));
/**
 * Request to request completion at a given text document position. The request's
 * parameter is of type [TextDocumentPosition](#TextDocumentPosition) the response
 * is of type [CompletionItem[]](#CompletionItem) or [CompletionList](#CompletionList)
 * or a Thenable that resolves to such.
 *
 * The request can delay the computation of the [`detail`](#CompletionItem.detail)
 * and [`documentation`](#CompletionItem.documentation) properties to the `completionItem/resolve`
 * request. However, properties that are needed for the initial sorting and filtering, like `sortText`,
 * `filterText`, `insertText`, and `textEdit`, must not be changed during resolve.
 */
var CompletionRequest;
(function (CompletionRequest) {
    CompletionRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/completion');
})(CompletionRequest = exports.CompletionRequest || (exports.CompletionRequest = {}));
/**
 * Request to resolve additional information for a given completion item.The request's
 * parameter is of type [CompletionItem](#CompletionItem) the response
 * is of type [CompletionItem](#CompletionItem) or a Thenable that resolves to such.
 */
var CompletionResolveRequest;
(function (CompletionResolveRequest) {
    CompletionResolveRequest.type = new vscode_jsonrpc_1.RequestType('completionItem/resolve');
})(CompletionResolveRequest = exports.CompletionResolveRequest || (exports.CompletionResolveRequest = {}));
//---- Hover Support -------------------------------
/**
 * Request to request hover information at a given text document position. The request's
 * parameter is of type [TextDocumentPosition](#TextDocumentPosition) the response is of
 * type [Hover](#Hover) or a Thenable that resolves to such.
 */
var HoverRequest;
(function (HoverRequest) {
    HoverRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/hover');
})(HoverRequest = exports.HoverRequest || (exports.HoverRequest = {}));
var SignatureHelpRequest;
(function (SignatureHelpRequest) {
    SignatureHelpRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/signatureHelp');
})(SignatureHelpRequest = exports.SignatureHelpRequest || (exports.SignatureHelpRequest = {}));
//---- Goto Definition -------------------------------------
/**
 * A request to resolve the definition location of a symbol at a given text
 * document position. The request's parameter is of type [TextDocumentPosition]
 * (#TextDocumentPosition) the response is of type [Definition](#Definition) or a
 * Thenable that resolves to such.
 */
var DefinitionRequest;
(function (DefinitionRequest) {
    DefinitionRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/definition');
})(DefinitionRequest = exports.DefinitionRequest || (exports.DefinitionRequest = {}));
/**
 * A request to resolve project-wide references for the symbol denoted
 * by the given text document position. The request's parameter is of
 * type [ReferenceParams](#ReferenceParams) the response is of type
 * [Location[]](#Location) or a Thenable that resolves to such.
 */
var ReferencesRequest;
(function (ReferencesRequest) {
    ReferencesRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/references');
})(ReferencesRequest = exports.ReferencesRequest || (exports.ReferencesRequest = {}));
//---- Document Highlight ----------------------------------
/**
 * Request to resolve a [DocumentHighlight](#DocumentHighlight) for a given
 * text document position. The request's parameter is of type [TextDocumentPosition]
 * (#TextDocumentPosition) the request response is of type [DocumentHighlight[]]
 * (#DocumentHighlight) or a Thenable that resolves to such.
 */
var DocumentHighlightRequest;
(function (DocumentHighlightRequest) {
    DocumentHighlightRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/documentHighlight');
})(DocumentHighlightRequest = exports.DocumentHighlightRequest || (exports.DocumentHighlightRequest = {}));
//---- Document Symbol Provider ---------------------------
/**
 * A request to list all symbols found in a given text document. The request's
 * parameter is of type [TextDocumentIdentifier](#TextDocumentIdentifier) the
 * response is of type [SymbolInformation[]](#SymbolInformation) or a Thenable
 * that resolves to such.
 */
var DocumentSymbolRequest;
(function (DocumentSymbolRequest) {
    DocumentSymbolRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/documentSymbol');
})(DocumentSymbolRequest = exports.DocumentSymbolRequest || (exports.DocumentSymbolRequest = {}));
//---- Workspace Symbol Provider ---------------------------
/**
 * A request to list project-wide symbols matching the query string given
 * by the [WorkspaceSymbolParams](#WorkspaceSymbolParams). The response is
 * of type [SymbolInformation[]](#SymbolInformation) or a Thenable that
 * resolves to such.
 */
var WorkspaceSymbolRequest;
(function (WorkspaceSymbolRequest) {
    WorkspaceSymbolRequest.type = new vscode_jsonrpc_1.RequestType('workspace/symbol');
})(WorkspaceSymbolRequest = exports.WorkspaceSymbolRequest || (exports.WorkspaceSymbolRequest = {}));
/**
 * A request to provide commands for the given text document and range.
 */
var CodeActionRequest;
(function (CodeActionRequest) {
    CodeActionRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/codeAction');
})(CodeActionRequest = exports.CodeActionRequest || (exports.CodeActionRequest = {}));
/**
 * A request to provide code lens for the given text document.
 */
var CodeLensRequest;
(function (CodeLensRequest) {
    CodeLensRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/codeLens');
})(CodeLensRequest = exports.CodeLensRequest || (exports.CodeLensRequest = {}));
/**
 * A request to resolve a command for a given code lens.
 */
var CodeLensResolveRequest;
(function (CodeLensResolveRequest) {
    CodeLensResolveRequest.type = new vscode_jsonrpc_1.RequestType('codeLens/resolve');
})(CodeLensResolveRequest = exports.CodeLensResolveRequest || (exports.CodeLensResolveRequest = {}));
/**
 * A request to to format a whole document.
 */
var DocumentFormattingRequest;
(function (DocumentFormattingRequest) {
    DocumentFormattingRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/formatting');
})(DocumentFormattingRequest = exports.DocumentFormattingRequest || (exports.DocumentFormattingRequest = {}));
/**
 * A request to to format a range in a document.
 */
var DocumentRangeFormattingRequest;
(function (DocumentRangeFormattingRequest) {
    DocumentRangeFormattingRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/rangeFormatting');
})(DocumentRangeFormattingRequest = exports.DocumentRangeFormattingRequest || (exports.DocumentRangeFormattingRequest = {}));
/**
 * A request to format a document on type.
 */
var DocumentOnTypeFormattingRequest;
(function (DocumentOnTypeFormattingRequest) {
    DocumentOnTypeFormattingRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/onTypeFormatting');
})(DocumentOnTypeFormattingRequest = exports.DocumentOnTypeFormattingRequest || (exports.DocumentOnTypeFormattingRequest = {}));
/**
 * A request to rename a symbol.
 */
var RenameRequest;
(function (RenameRequest) {
    RenameRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/rename');
})(RenameRequest = exports.RenameRequest || (exports.RenameRequest = {}));
/**
 * A request to test and perform the setup necessary for a rename.
 */
var PrepareRenameRequest;
(function (PrepareRenameRequest) {
    PrepareRenameRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/prepareRename');
})(PrepareRenameRequest = exports.PrepareRenameRequest || (exports.PrepareRenameRequest = {}));
/**
 * A request to provide document links
 */
var DocumentLinkRequest;
(function (DocumentLinkRequest) {
    DocumentLinkRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/documentLink');
})(DocumentLinkRequest = exports.DocumentLinkRequest || (exports.DocumentLinkRequest = {}));
/**
 * Request to resolve additional information for a given document link. The request's
 * parameter is of type [DocumentLink](#DocumentLink) the response
 * is of type [DocumentLink](#DocumentLink) or a Thenable that resolves to such.
 */
var DocumentLinkResolveRequest;
(function (DocumentLinkResolveRequest) {
    DocumentLinkResolveRequest.type = new vscode_jsonrpc_1.RequestType('documentLink/resolve');
})(DocumentLinkResolveRequest = exports.DocumentLinkResolveRequest || (exports.DocumentLinkResolveRequest = {}));
/**
 * A request send from the client to the server to execute a command. The request might return
 * a workspace edit which the client will apply to the workspace.
 */
var ExecuteCommandRequest;
(function (ExecuteCommandRequest) {
    ExecuteCommandRequest.type = new vscode_jsonrpc_1.RequestType('workspace/executeCommand');
})(ExecuteCommandRequest = exports.ExecuteCommandRequest || (exports.ExecuteCommandRequest = {}));
/**
 * A request sent from the server to the client to modified certain resources.
 */
var ApplyWorkspaceEditRequest;
(function (ApplyWorkspaceEditRequest) {
    ApplyWorkspaceEditRequest.type = new vscode_jsonrpc_1.RequestType('workspace/applyEdit');
})(ApplyWorkspaceEditRequest = exports.ApplyWorkspaceEditRequest || (exports.ApplyWorkspaceEditRequest = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.typeDefinition.js":
/*!*********************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.typeDefinition.js ***!
  \*********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
/**
 * A request to resolve the type definition locations of a symbol at a given text
 * document position. The request's parameter is of type [TextDocumentPositioParams]
 * (#TextDocumentPositionParams) the response is of type [Definition](#Definition) or a
 * Thenable that resolves to such.
 */
var TypeDefinitionRequest;
(function (TypeDefinitionRequest) {
    TypeDefinitionRequest.type = new vscode_jsonrpc_1.RequestType('textDocument/typeDefinition');
})(TypeDefinitionRequest = exports.TypeDefinitionRequest || (exports.TypeDefinitionRequest = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.workspaceFolders.js":
/*!***********************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/protocol.workspaceFolders.js ***!
  \***********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const vscode_jsonrpc_1 = __webpack_require__(/*! vscode-jsonrpc */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js");
/**
 * The `workspace/workspaceFolders` is sent from the server to the client to fetch the open workspace folders.
 */
var WorkspaceFoldersRequest;
(function (WorkspaceFoldersRequest) {
    WorkspaceFoldersRequest.type = new vscode_jsonrpc_1.RequestType0('workspace/workspaceFolders');
})(WorkspaceFoldersRequest = exports.WorkspaceFoldersRequest || (exports.WorkspaceFoldersRequest = {}));
/**
 * The `workspace/didChangeWorkspaceFolders` notification is sent from the client to the server when the workspace
 * folder configuration changes.
 */
var DidChangeWorkspaceFoldersNotification;
(function (DidChangeWorkspaceFoldersNotification) {
    DidChangeWorkspaceFoldersNotification.type = new vscode_jsonrpc_1.NotificationType('workspace/didChangeWorkspaceFolders');
})(DidChangeWorkspaceFoldersNotification = exports.DidChangeWorkspaceFoldersNotification || (exports.DidChangeWorkspaceFoldersNotification = {}));


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/utils/is.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/lib/utils/is.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const toString = Object.prototype.toString;
function boolean(value) {
    return value === true || value === false;
}
exports.boolean = boolean;
function string(value) {
    return toString.call(value) === '[object String]';
}
exports.string = string;
function number(value) {
    return toString.call(value) === '[object Number]';
}
exports.number = number;
function error(value) {
    return toString.call(value) === '[object Error]';
}
exports.error = error;
function func(value) {
    return toString.call(value) === '[object Function]';
}
exports.func = func;
function array(value) {
    return Array.isArray(value);
}
exports.array = array;
function stringArray(value) {
    return array(value) && value.every(elem => string(elem));
}
exports.stringArray = stringArray;
function typedArray(value, check) {
    return Array.isArray(value) && value.every(check);
}
exports.typedArray = typedArray;
function thenable(value) {
    return value && func(value.then);
}
exports.thenable = thenable;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/cancellation.js":
/*!**************************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/cancellation.js ***!
  \**************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = __webpack_require__(/*! ./events */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/events.js");
var Is = __webpack_require__(/*! ./is */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js");
var CancellationToken;
(function (CancellationToken) {
    CancellationToken.None = Object.freeze({
        isCancellationRequested: false,
        onCancellationRequested: events_1.Event.None
    });
    CancellationToken.Cancelled = Object.freeze({
        isCancellationRequested: true,
        onCancellationRequested: events_1.Event.None
    });
    function is(value) {
        var candidate = value;
        return candidate && (candidate === CancellationToken.None
            || candidate === CancellationToken.Cancelled
            || (Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested));
    }
    CancellationToken.is = is;
})(CancellationToken = exports.CancellationToken || (exports.CancellationToken = {}));
var shortcutEvent = Object.freeze(function (callback, context) {
    var handle = setTimeout(callback.bind(context), 0);
    return { dispose: function () { clearTimeout(handle); } };
});
var MutableToken = /** @class */ (function () {
    function MutableToken() {
        this._isCancelled = false;
    }
    MutableToken.prototype.cancel = function () {
        if (!this._isCancelled) {
            this._isCancelled = true;
            if (this._emitter) {
                this._emitter.fire(undefined);
                this._emitter = undefined;
            }
        }
    };
    Object.defineProperty(MutableToken.prototype, "isCancellationRequested", {
        get: function () {
            return this._isCancelled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MutableToken.prototype, "onCancellationRequested", {
        get: function () {
            if (this._isCancelled) {
                return shortcutEvent;
            }
            if (!this._emitter) {
                this._emitter = new events_1.Emitter();
            }
            return this._emitter.event;
        },
        enumerable: true,
        configurable: true
    });
    return MutableToken;
}());
var CancellationTokenSource = /** @class */ (function () {
    function CancellationTokenSource() {
    }
    Object.defineProperty(CancellationTokenSource.prototype, "token", {
        get: function () {
            if (!this._token) {
                // be lazy and create the token only when
                // actually needed
                this._token = new MutableToken();
            }
            return this._token;
        },
        enumerable: true,
        configurable: true
    });
    CancellationTokenSource.prototype.cancel = function () {
        if (!this._token) {
            // save an object by returning the default
            // cancelled token when cancellation happens
            // before someone asks for the token
            this._token = CancellationToken.Cancelled;
        }
        else {
            this._token.cancel();
        }
    };
    CancellationTokenSource.prototype.dispose = function () {
        this.cancel();
    };
    return CancellationTokenSource;
}());
exports.CancellationTokenSource = CancellationTokenSource;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/events.js":
/*!********************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/events.js ***!
  \********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
var Disposable;
(function (Disposable) {
    function create(func) {
        return {
            dispose: func
        };
    }
    Disposable.create = create;
})(Disposable = exports.Disposable || (exports.Disposable = {}));
var Event;
(function (Event) {
    var _disposable = { dispose: function () { } };
    Event.None = function () { return _disposable; };
})(Event = exports.Event || (exports.Event = {}));
var CallbackList = /** @class */ (function () {
    function CallbackList() {
    }
    CallbackList.prototype.add = function (callback, context, bucket) {
        var _this = this;
        if (context === void 0) { context = null; }
        if (!this._callbacks) {
            this._callbacks = [];
            this._contexts = [];
        }
        this._callbacks.push(callback);
        this._contexts.push(context);
        if (Array.isArray(bucket)) {
            bucket.push({ dispose: function () { return _this.remove(callback, context); } });
        }
    };
    CallbackList.prototype.remove = function (callback, context) {
        if (context === void 0) { context = null; }
        if (!this._callbacks) {
            return;
        }
        var foundCallbackWithDifferentContext = false;
        for (var i = 0, len = this._callbacks.length; i < len; i++) {
            if (this._callbacks[i] === callback) {
                if (this._contexts[i] === context) {
                    // callback & context match => remove it
                    this._callbacks.splice(i, 1);
                    this._contexts.splice(i, 1);
                    return;
                }
                else {
                    foundCallbackWithDifferentContext = true;
                }
            }
        }
        if (foundCallbackWithDifferentContext) {
            throw new Error('When adding a listener with a context, you should remove it with the same context');
        }
    };
    CallbackList.prototype.invoke = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!this._callbacks) {
            return [];
        }
        var ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
        for (var i = 0, len = callbacks.length; i < len; i++) {
            try {
                ret.push(callbacks[i].apply(contexts[i], args));
            }
            catch (e) {
                console.error(e);
            }
        }
        return ret;
    };
    CallbackList.prototype.isEmpty = function () {
        return !this._callbacks || this._callbacks.length === 0;
    };
    CallbackList.prototype.dispose = function () {
        this._callbacks = undefined;
        this._contexts = undefined;
    };
    return CallbackList;
}());
var Emitter = /** @class */ (function () {
    function Emitter(_options) {
        this._options = _options;
    }
    Object.defineProperty(Emitter.prototype, "event", {
        /**
         * For the public to allow to subscribe
         * to events from this Emitter
         */
        get: function () {
            var _this = this;
            if (!this._event) {
                this._event = function (listener, thisArgs, disposables) {
                    if (!_this._callbacks) {
                        _this._callbacks = new CallbackList();
                    }
                    if (_this._options && _this._options.onFirstListenerAdd && _this._callbacks.isEmpty()) {
                        _this._options.onFirstListenerAdd(_this);
                    }
                    _this._callbacks.add(listener, thisArgs);
                    var result;
                    result = {
                        dispose: function () {
                            _this._callbacks.remove(listener, thisArgs);
                            result.dispose = Emitter._noop;
                            if (_this._options && _this._options.onLastListenerRemove && _this._callbacks.isEmpty()) {
                                _this._options.onLastListenerRemove(_this);
                            }
                        }
                    };
                    if (Array.isArray(disposables)) {
                        disposables.push(result);
                    }
                    return result;
                };
            }
            return this._event;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * To be kept private to fire an event to
     * subscribers
     */
    Emitter.prototype.fire = function (event) {
        if (this._callbacks) {
            this._callbacks.invoke.call(this._callbacks, event);
        }
    };
    Emitter.prototype.dispose = function () {
        if (this._callbacks) {
            this._callbacks.dispose();
            this._callbacks = undefined;
        }
    };
    Emitter._noop = function () { };
    return Emitter;
}());
exports.Emitter = Emitter;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js":
/*!****************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js ***!
  \****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
var toString = Object.prototype.toString;
function boolean(value) {
    return value === true || value === false;
}
exports.boolean = boolean;
function string(value) {
    return toString.call(value) === '[object String]';
}
exports.string = string;
function number(value) {
    return toString.call(value) === '[object Number]';
}
exports.number = number;
function error(value) {
    return toString.call(value) === '[object Error]';
}
exports.error = error;
function func(value) {
    return toString.call(value) === '[object Function]';
}
exports.func = func;
function array(value) {
    return Array.isArray(value);
}
exports.array = array;
function stringArray(value) {
    return array(value) && value.every(function (elem) { return string(elem); });
}
exports.stringArray = stringArray;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/linkedMap.js":
/*!***********************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/linkedMap.js ***!
  \***********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
var Touch;
(function (Touch) {
    Touch.None = 0;
    Touch.First = 1;
    Touch.Last = 2;
})(Touch = exports.Touch || (exports.Touch = {}));
var LinkedMap = /** @class */ (function () {
    function LinkedMap() {
        this._map = new Map();
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
    }
    LinkedMap.prototype.clear = function () {
        this._map.clear();
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
    };
    LinkedMap.prototype.isEmpty = function () {
        return !this._head && !this._tail;
    };
    Object.defineProperty(LinkedMap.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: true,
        configurable: true
    });
    LinkedMap.prototype.has = function (key) {
        return this._map.has(key);
    };
    LinkedMap.prototype.get = function (key) {
        var item = this._map.get(key);
        if (!item) {
            return undefined;
        }
        return item.value;
    };
    LinkedMap.prototype.set = function (key, value, touch) {
        if (touch === void 0) { touch = Touch.None; }
        var item = this._map.get(key);
        if (item) {
            item.value = value;
            if (touch !== Touch.None) {
                this.touch(item, touch);
            }
        }
        else {
            item = { key: key, value: value, next: undefined, previous: undefined };
            switch (touch) {
                case Touch.None:
                    this.addItemLast(item);
                    break;
                case Touch.First:
                    this.addItemFirst(item);
                    break;
                case Touch.Last:
                    this.addItemLast(item);
                    break;
                default:
                    this.addItemLast(item);
                    break;
            }
            this._map.set(key, item);
            this._size++;
        }
    };
    LinkedMap.prototype.delete = function (key) {
        var item = this._map.get(key);
        if (!item) {
            return false;
        }
        this._map.delete(key);
        this.removeItem(item);
        this._size--;
        return true;
    };
    LinkedMap.prototype.shift = function () {
        if (!this._head && !this._tail) {
            return undefined;
        }
        if (!this._head || !this._tail) {
            throw new Error('Invalid list');
        }
        var item = this._head;
        this._map.delete(item.key);
        this.removeItem(item);
        this._size--;
        return item.value;
    };
    LinkedMap.prototype.forEach = function (callbackfn, thisArg) {
        var current = this._head;
        while (current) {
            if (thisArg) {
                callbackfn.bind(thisArg)(current.value, current.key, this);
            }
            else {
                callbackfn(current.value, current.key, this);
            }
            current = current.next;
        }
    };
    LinkedMap.prototype.forEachReverse = function (callbackfn, thisArg) {
        var current = this._tail;
        while (current) {
            if (thisArg) {
                callbackfn.bind(thisArg)(current.value, current.key, this);
            }
            else {
                callbackfn(current.value, current.key, this);
            }
            current = current.previous;
        }
    };
    LinkedMap.prototype.values = function () {
        var result = [];
        var current = this._head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    };
    LinkedMap.prototype.keys = function () {
        var result = [];
        var current = this._head;
        while (current) {
            result.push(current.key);
            current = current.next;
        }
        return result;
    };
    /* JSON RPC run on es5 which has no Symbol.iterator
    public keys(): IterableIterator<K> {
        let current = this._head;
        let iterator: IterableIterator<K> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next():IteratorResult<K> {
                if (current) {
                    let result = { value: current.key, done: false };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }

    public values(): IterableIterator<V> {
        let current = this._head;
        let iterator: IterableIterator<V> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next():IteratorResult<V> {
                if (current) {
                    let result = { value: current.value, done: false };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }
    */
    LinkedMap.prototype.addItemFirst = function (item) {
        // First time Insert
        if (!this._head && !this._tail) {
            this._tail = item;
        }
        else if (!this._head) {
            throw new Error('Invalid list');
        }
        else {
            item.next = this._head;
            this._head.previous = item;
        }
        this._head = item;
    };
    LinkedMap.prototype.addItemLast = function (item) {
        // First time Insert
        if (!this._head && !this._tail) {
            this._head = item;
        }
        else if (!this._tail) {
            throw new Error('Invalid list');
        }
        else {
            item.previous = this._tail;
            this._tail.next = item;
        }
        this._tail = item;
    };
    LinkedMap.prototype.removeItem = function (item) {
        if (item === this._head && item === this._tail) {
            this._head = undefined;
            this._tail = undefined;
        }
        else if (item === this._head) {
            this._head = item.next;
        }
        else if (item === this._tail) {
            this._tail = item.previous;
        }
        else {
            var next = item.next;
            var previous = item.previous;
            if (!next || !previous) {
                throw new Error('Invalid list');
            }
            next.previous = previous;
            previous.next = next;
        }
    };
    LinkedMap.prototype.touch = function (item, touch) {
        if (!this._head || !this._tail) {
            throw new Error('Invalid list');
        }
        if ((touch !== Touch.First && touch !== Touch.Last)) {
            return;
        }
        if (touch === Touch.First) {
            if (item === this._head) {
                return;
            }
            var next = item.next;
            var previous = item.previous;
            // Unlink the item
            if (item === this._tail) {
                // previous must be defined since item was not head but is tail
                // So there are more than on item in the map
                previous.next = undefined;
                this._tail = previous;
            }
            else {
                // Both next and previous are not undefined since item was neither head nor tail.
                next.previous = previous;
                previous.next = next;
            }
            // Insert the node at head
            item.previous = undefined;
            item.next = this._head;
            this._head.previous = item;
            this._head = item;
        }
        else if (touch === Touch.Last) {
            if (item === this._tail) {
                return;
            }
            var next = item.next;
            var previous = item.previous;
            // Unlink the item.
            if (item === this._head) {
                // next must be defined since item was not tail but is head
                // So there are more than on item in the map
                next.previous = undefined;
                this._head = next;
            }
            else {
                // Both next and previous are not undefined since item was neither head nor tail.
                next.previous = previous;
                previous.next = next;
            }
            item.next = undefined;
            item.previous = this._tail;
            this._tail.next = item;
            this._tail = item;
        }
    };
    return LinkedMap;
}());
exports.LinkedMap = LinkedMap;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js":
/*!******************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/main.js ***!
  \******************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="./thenable.ts" />

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var Is = __webpack_require__(/*! ./is */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js");
var messages_1 = __webpack_require__(/*! ./messages */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messages.js");
exports.RequestType = messages_1.RequestType;
exports.RequestType0 = messages_1.RequestType0;
exports.RequestType1 = messages_1.RequestType1;
exports.RequestType2 = messages_1.RequestType2;
exports.RequestType3 = messages_1.RequestType3;
exports.RequestType4 = messages_1.RequestType4;
exports.RequestType5 = messages_1.RequestType5;
exports.RequestType6 = messages_1.RequestType6;
exports.RequestType7 = messages_1.RequestType7;
exports.RequestType8 = messages_1.RequestType8;
exports.RequestType9 = messages_1.RequestType9;
exports.ResponseError = messages_1.ResponseError;
exports.ErrorCodes = messages_1.ErrorCodes;
exports.NotificationType = messages_1.NotificationType;
exports.NotificationType0 = messages_1.NotificationType0;
exports.NotificationType1 = messages_1.NotificationType1;
exports.NotificationType2 = messages_1.NotificationType2;
exports.NotificationType3 = messages_1.NotificationType3;
exports.NotificationType4 = messages_1.NotificationType4;
exports.NotificationType5 = messages_1.NotificationType5;
exports.NotificationType6 = messages_1.NotificationType6;
exports.NotificationType7 = messages_1.NotificationType7;
exports.NotificationType8 = messages_1.NotificationType8;
exports.NotificationType9 = messages_1.NotificationType9;
var messageReader_1 = __webpack_require__(/*! ./messageReader */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageReader.js");
exports.MessageReader = messageReader_1.MessageReader;
exports.StreamMessageReader = messageReader_1.StreamMessageReader;
exports.IPCMessageReader = messageReader_1.IPCMessageReader;
exports.SocketMessageReader = messageReader_1.SocketMessageReader;
var messageWriter_1 = __webpack_require__(/*! ./messageWriter */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageWriter.js");
exports.MessageWriter = messageWriter_1.MessageWriter;
exports.StreamMessageWriter = messageWriter_1.StreamMessageWriter;
exports.IPCMessageWriter = messageWriter_1.IPCMessageWriter;
exports.SocketMessageWriter = messageWriter_1.SocketMessageWriter;
var events_1 = __webpack_require__(/*! ./events */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/events.js");
exports.Disposable = events_1.Disposable;
exports.Event = events_1.Event;
exports.Emitter = events_1.Emitter;
var cancellation_1 = __webpack_require__(/*! ./cancellation */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/cancellation.js");
exports.CancellationTokenSource = cancellation_1.CancellationTokenSource;
exports.CancellationToken = cancellation_1.CancellationToken;
var linkedMap_1 = __webpack_require__(/*! ./linkedMap */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/linkedMap.js");
__export(__webpack_require__(/*! ./pipeSupport */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/pipeSupport.js"));
__export(__webpack_require__(/*! ./socketSupport */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/socketSupport.js"));
var CancelNotification;
(function (CancelNotification) {
    CancelNotification.type = new messages_1.NotificationType('$/cancelRequest');
})(CancelNotification || (CancelNotification = {}));
exports.NullLogger = Object.freeze({
    error: function () { },
    warn: function () { },
    info: function () { },
    log: function () { }
});
var Trace;
(function (Trace) {
    Trace[Trace["Off"] = 0] = "Off";
    Trace[Trace["Messages"] = 1] = "Messages";
    Trace[Trace["Verbose"] = 2] = "Verbose";
})(Trace = exports.Trace || (exports.Trace = {}));
(function (Trace) {
    function fromString(value) {
        value = value.toLowerCase();
        switch (value) {
            case 'off':
                return Trace.Off;
            case 'messages':
                return Trace.Messages;
            case 'verbose':
                return Trace.Verbose;
            default:
                return Trace.Off;
        }
    }
    Trace.fromString = fromString;
    function toString(value) {
        switch (value) {
            case Trace.Off:
                return 'off';
            case Trace.Messages:
                return 'messages';
            case Trace.Verbose:
                return 'verbose';
            default:
                return 'off';
        }
    }
    Trace.toString = toString;
})(Trace = exports.Trace || (exports.Trace = {}));
var SetTraceNotification;
(function (SetTraceNotification) {
    SetTraceNotification.type = new messages_1.NotificationType('$/setTraceNotification');
})(SetTraceNotification = exports.SetTraceNotification || (exports.SetTraceNotification = {}));
var LogTraceNotification;
(function (LogTraceNotification) {
    LogTraceNotification.type = new messages_1.NotificationType('$/logTraceNotification');
})(LogTraceNotification = exports.LogTraceNotification || (exports.LogTraceNotification = {}));
var ConnectionErrors;
(function (ConnectionErrors) {
    /**
     * The connection is closed.
     */
    ConnectionErrors[ConnectionErrors["Closed"] = 1] = "Closed";
    /**
     * The connection got disposed.
     */
    ConnectionErrors[ConnectionErrors["Disposed"] = 2] = "Disposed";
    /**
     * The connection is already in listening mode.
     */
    ConnectionErrors[ConnectionErrors["AlreadyListening"] = 3] = "AlreadyListening";
})(ConnectionErrors = exports.ConnectionErrors || (exports.ConnectionErrors = {}));
var ConnectionError = /** @class */ (function (_super) {
    __extends(ConnectionError, _super);
    function ConnectionError(code, message) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        Object.setPrototypeOf(_this, ConnectionError.prototype);
        return _this;
    }
    return ConnectionError;
}(Error));
exports.ConnectionError = ConnectionError;
var ConnectionStrategy;
(function (ConnectionStrategy) {
    function is(value) {
        var candidate = value;
        return candidate && Is.func(candidate.cancelUndispatched);
    }
    ConnectionStrategy.is = is;
})(ConnectionStrategy = exports.ConnectionStrategy || (exports.ConnectionStrategy = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["New"] = 1] = "New";
    ConnectionState[ConnectionState["Listening"] = 2] = "Listening";
    ConnectionState[ConnectionState["Closed"] = 3] = "Closed";
    ConnectionState[ConnectionState["Disposed"] = 4] = "Disposed";
})(ConnectionState || (ConnectionState = {}));
function _createMessageConnection(messageReader, messageWriter, logger, strategy) {
    var sequenceNumber = 0;
    var notificationSquenceNumber = 0;
    var unknownResponseSquenceNumber = 0;
    var version = '2.0';
    var starRequestHandler = undefined;
    var requestHandlers = Object.create(null);
    var starNotificationHandler = undefined;
    var notificationHandlers = Object.create(null);
    var timer;
    var messageQueue = new linkedMap_1.LinkedMap();
    var responsePromises = Object.create(null);
    var requestTokens = Object.create(null);
    var trace = Trace.Off;
    var tracer;
    var state = ConnectionState.New;
    var errorEmitter = new events_1.Emitter();
    var closeEmitter = new events_1.Emitter();
    var unhandledNotificationEmitter = new events_1.Emitter();
    var disposeEmitter = new events_1.Emitter();
    function createRequestQueueKey(id) {
        return 'req-' + id.toString();
    }
    function createResponseQueueKey(id) {
        if (id === null) {
            return 'res-unknown-' + (++unknownResponseSquenceNumber).toString();
        }
        else {
            return 'res-' + id.toString();
        }
    }
    function createNotificationQueueKey() {
        return 'not-' + (++notificationSquenceNumber).toString();
    }
    function addMessageToQueue(queue, message) {
        if (messages_1.isRequestMessage(message)) {
            queue.set(createRequestQueueKey(message.id), message);
        }
        else if (messages_1.isResponseMessage(message)) {
            queue.set(createResponseQueueKey(message.id), message);
        }
        else {
            queue.set(createNotificationQueueKey(), message);
        }
    }
    function cancelUndispatched(_message) {
        return undefined;
    }
    function isListening() {
        return state === ConnectionState.Listening;
    }
    function isClosed() {
        return state === ConnectionState.Closed;
    }
    function isDisposed() {
        return state === ConnectionState.Disposed;
    }
    function closeHandler() {
        if (state === ConnectionState.New || state === ConnectionState.Listening) {
            state = ConnectionState.Closed;
            closeEmitter.fire(undefined);
        }
        // If the connection is disposed don't sent close events.
    }
    ;
    function readErrorHandler(error) {
        errorEmitter.fire([error, undefined, undefined]);
    }
    function writeErrorHandler(data) {
        errorEmitter.fire(data);
    }
    messageReader.onClose(closeHandler);
    messageReader.onError(readErrorHandler);
    messageWriter.onClose(closeHandler);
    messageWriter.onError(writeErrorHandler);
    function triggerMessageQueue() {
        if (timer || messageQueue.size === 0) {
            return;
        }
        timer = setImmediate(function () {
            timer = undefined;
            processMessageQueue();
        });
    }
    function processMessageQueue() {
        if (messageQueue.size === 0) {
            return;
        }
        var message = messageQueue.shift();
        try {
            if (messages_1.isRequestMessage(message)) {
                handleRequest(message);
            }
            else if (messages_1.isNotificationMessage(message)) {
                handleNotification(message);
            }
            else if (messages_1.isResponseMessage(message)) {
                handleResponse(message);
            }
            else {
                handleInvalidMessage(message);
            }
        }
        finally {
            triggerMessageQueue();
        }
    }
    var callback = function (message) {
        try {
            // We have received a cancellation message. Check if the message is still in the queue
            // and cancel it if allowed to do so.
            if (messages_1.isNotificationMessage(message) && message.method === CancelNotification.type.method) {
                var key = createRequestQueueKey(message.params.id);
                var toCancel = messageQueue.get(key);
                if (messages_1.isRequestMessage(toCancel)) {
                    var response = strategy && strategy.cancelUndispatched ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
                    if (response && (response.error !== void 0 || response.result !== void 0)) {
                        messageQueue.delete(key);
                        response.id = toCancel.id;
                        traceSendingResponse(response, message.method, Date.now());
                        messageWriter.write(response);
                        return;
                    }
                }
            }
            addMessageToQueue(messageQueue, message);
        }
        finally {
            triggerMessageQueue();
        }
    };
    function handleRequest(requestMessage) {
        if (isDisposed()) {
            // we return here silently since we fired an event when the
            // connection got disposed.
            return;
        }
        function reply(resultOrError, method, startTime) {
            var message = {
                jsonrpc: version,
                id: requestMessage.id
            };
            if (resultOrError instanceof messages_1.ResponseError) {
                message.error = resultOrError.toJson();
            }
            else {
                message.result = resultOrError === void 0 ? null : resultOrError;
            }
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message);
        }
        function replyError(error, method, startTime) {
            var message = {
                jsonrpc: version,
                id: requestMessage.id,
                error: error.toJson()
            };
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message);
        }
        function replySuccess(result, method, startTime) {
            // The JSON RPC defines that a response must either have a result or an error
            // So we can't treat undefined as a valid response result.
            if (result === void 0) {
                result = null;
            }
            var message = {
                jsonrpc: version,
                id: requestMessage.id,
                result: result
            };
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message);
        }
        traceReceivedRequest(requestMessage);
        var element = requestHandlers[requestMessage.method];
        var type;
        var requestHandler;
        if (element) {
            type = element.type;
            requestHandler = element.handler;
        }
        var startTime = Date.now();
        if (requestHandler || starRequestHandler) {
            var cancellationSource = new cancellation_1.CancellationTokenSource();
            var tokenKey_1 = String(requestMessage.id);
            requestTokens[tokenKey_1] = cancellationSource;
            try {
                var handlerResult = void 0;
                if (requestMessage.params === void 0 || (type !== void 0 && type.numberOfParams === 0)) {
                    handlerResult = requestHandler
                        ? requestHandler(cancellationSource.token)
                        : starRequestHandler(requestMessage.method, cancellationSource.token);
                }
                else if (Is.array(requestMessage.params) && (type === void 0 || type.numberOfParams > 1)) {
                    handlerResult = requestHandler
                        ? requestHandler.apply(void 0, requestMessage.params.concat([cancellationSource.token])) : starRequestHandler.apply(void 0, [requestMessage.method].concat(requestMessage.params, [cancellationSource.token]));
                }
                else {
                    handlerResult = requestHandler
                        ? requestHandler(requestMessage.params, cancellationSource.token)
                        : starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
                }
                var promise = handlerResult;
                if (!handlerResult) {
                    delete requestTokens[tokenKey_1];
                    replySuccess(handlerResult, requestMessage.method, startTime);
                }
                else if (promise.then) {
                    promise.then(function (resultOrError) {
                        delete requestTokens[tokenKey_1];
                        reply(resultOrError, requestMessage.method, startTime);
                    }, function (error) {
                        delete requestTokens[tokenKey_1];
                        if (error instanceof messages_1.ResponseError) {
                            replyError(error, requestMessage.method, startTime);
                        }
                        else if (error && Is.string(error.message)) {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, "Request " + requestMessage.method + " failed with message: " + error.message), requestMessage.method, startTime);
                        }
                        else {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, "Request " + requestMessage.method + " failed unexpectedly without providing any details."), requestMessage.method, startTime);
                        }
                    });
                }
                else {
                    delete requestTokens[tokenKey_1];
                    reply(handlerResult, requestMessage.method, startTime);
                }
            }
            catch (error) {
                delete requestTokens[tokenKey_1];
                if (error instanceof messages_1.ResponseError) {
                    reply(error, requestMessage.method, startTime);
                }
                else if (error && Is.string(error.message)) {
                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, "Request " + requestMessage.method + " failed with message: " + error.message), requestMessage.method, startTime);
                }
                else {
                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, "Request " + requestMessage.method + " failed unexpectedly without providing any details."), requestMessage.method, startTime);
                }
            }
        }
        else {
            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, "Unhandled method " + requestMessage.method), requestMessage.method, startTime);
        }
    }
    function handleResponse(responseMessage) {
        if (isDisposed()) {
            // See handle request.
            return;
        }
        if (responseMessage.id === null) {
            if (responseMessage.error) {
                logger.error("Received response message without id: Error is: \n" + JSON.stringify(responseMessage.error, undefined, 4));
            }
            else {
                logger.error("Received response message without id. No further error information provided.");
            }
        }
        else {
            var key = String(responseMessage.id);
            var responsePromise = responsePromises[key];
            traceReceivedResponse(responseMessage, responsePromise);
            if (responsePromise) {
                delete responsePromises[key];
                try {
                    if (responseMessage.error) {
                        var error = responseMessage.error;
                        responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
                    }
                    else if (responseMessage.result !== void 0) {
                        responsePromise.resolve(responseMessage.result);
                    }
                    else {
                        throw new Error('Should never happen.');
                    }
                }
                catch (error) {
                    if (error.message) {
                        logger.error("Response handler '" + responsePromise.method + "' failed with message: " + error.message);
                    }
                    else {
                        logger.error("Response handler '" + responsePromise.method + "' failed unexpectedly.");
                    }
                }
            }
        }
    }
    function handleNotification(message) {
        if (isDisposed()) {
            // See handle request.
            return;
        }
        var type = undefined;
        var notificationHandler;
        if (message.method === CancelNotification.type.method) {
            notificationHandler = function (params) {
                var id = params.id;
                var source = requestTokens[String(id)];
                if (source) {
                    source.cancel();
                }
            };
        }
        else {
            var element = notificationHandlers[message.method];
            if (element) {
                notificationHandler = element.handler;
                type = element.type;
            }
        }
        if (notificationHandler || starNotificationHandler) {
            try {
                traceReceivedNotification(message);
                if (message.params === void 0 || (type !== void 0 && type.numberOfParams === 0)) {
                    notificationHandler ? notificationHandler() : starNotificationHandler(message.method);
                }
                else if (Is.array(message.params) && (type === void 0 || type.numberOfParams > 1)) {
                    notificationHandler ? notificationHandler.apply(void 0, message.params) : starNotificationHandler.apply(void 0, [message.method].concat(message.params));
                }
                else {
                    notificationHandler ? notificationHandler(message.params) : starNotificationHandler(message.method, message.params);
                }
            }
            catch (error) {
                if (error.message) {
                    logger.error("Notification handler '" + message.method + "' failed with message: " + error.message);
                }
                else {
                    logger.error("Notification handler '" + message.method + "' failed unexpectedly.");
                }
            }
        }
        else {
            unhandledNotificationEmitter.fire(message);
        }
    }
    function handleInvalidMessage(message) {
        if (!message) {
            logger.error('Received empty message.');
            return;
        }
        logger.error("Received message which is neither a response nor a notification message:\n" + JSON.stringify(message, null, 4));
        // Test whether we find an id to reject the promise
        var responseMessage = message;
        if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
            var key = String(responseMessage.id);
            var responseHandler = responsePromises[key];
            if (responseHandler) {
                responseHandler.reject(new Error('The received response has neither a result nor an error property.'));
            }
        }
    }
    function traceSendingRequest(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        var data = undefined;
        if (trace === Trace.Verbose && message.params) {
            data = "Params: " + JSON.stringify(message.params, null, 4) + "\n\n";
        }
        tracer.log("Sending request '" + message.method + " - (" + message.id + ")'.", data);
    }
    function traceSendNotification(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        var data = undefined;
        if (trace === Trace.Verbose) {
            if (message.params) {
                data = "Params: " + JSON.stringify(message.params, null, 4) + "\n\n";
            }
            else {
                data = 'No parameters provided.\n\n';
            }
        }
        tracer.log("Sending notification '" + message.method + "'.", data);
    }
    function traceSendingResponse(message, method, startTime) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        var data = undefined;
        if (trace === Trace.Verbose) {
            if (message.error && message.error.data) {
                data = "Error data: " + JSON.stringify(message.error.data, null, 4) + "\n\n";
            }
            else {
                if (message.result) {
                    data = "Result: " + JSON.stringify(message.result, null, 4) + "\n\n";
                }
                else if (message.error === void 0) {
                    data = 'No result returned.\n\n';
                }
            }
        }
        tracer.log("Sending response '" + method + " - (" + message.id + ")'. Processing request took " + (Date.now() - startTime) + "ms", data);
    }
    function traceReceivedRequest(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        var data = undefined;
        if (trace === Trace.Verbose && message.params) {
            data = "Params: " + JSON.stringify(message.params, null, 4) + "\n\n";
        }
        tracer.log("Received request '" + message.method + " - (" + message.id + ")'.", data);
    }
    function traceReceivedNotification(message) {
        if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
            return;
        }
        var data = undefined;
        if (trace === Trace.Verbose) {
            if (message.params) {
                data = "Params: " + JSON.stringify(message.params, null, 4) + "\n\n";
            }
            else {
                data = 'No parameters provided.\n\n';
            }
        }
        tracer.log("Received notification '" + message.method + "'.", data);
    }
    function traceReceivedResponse(message, responsePromise) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        var data = undefined;
        if (trace === Trace.Verbose) {
            if (message.error && message.error.data) {
                data = "Error data: " + JSON.stringify(message.error.data, null, 4) + "\n\n";
            }
            else {
                if (message.result) {
                    data = "Result: " + JSON.stringify(message.result, null, 4) + "\n\n";
                }
                else if (message.error === void 0) {
                    data = 'No result returned.\n\n';
                }
            }
        }
        if (responsePromise) {
            var error = message.error ? " Request failed: " + message.error.message + " (" + message.error.code + ")." : '';
            tracer.log("Received response '" + responsePromise.method + " - (" + message.id + ")' in " + (Date.now() - responsePromise.timerStart) + "ms." + error, data);
        }
        else {
            tracer.log("Received response " + message.id + " without active response promise.", data);
        }
    }
    function throwIfClosedOrDisposed() {
        if (isClosed()) {
            throw new ConnectionError(ConnectionErrors.Closed, 'Connection is closed.');
        }
        if (isDisposed()) {
            throw new ConnectionError(ConnectionErrors.Disposed, 'Connection is disposed.');
        }
    }
    function throwIfListening() {
        if (isListening()) {
            throw new ConnectionError(ConnectionErrors.AlreadyListening, 'Connection is already listening');
        }
    }
    function throwIfNotListening() {
        if (!isListening()) {
            throw new Error('Call listen() first.');
        }
    }
    function undefinedToNull(param) {
        if (param === void 0) {
            return null;
        }
        else {
            return param;
        }
    }
    function computeMessageParams(type, params) {
        var result;
        var numberOfParams = type.numberOfParams;
        switch (numberOfParams) {
            case 0:
                result = null;
                break;
            case 1:
                result = undefinedToNull(params[0]);
                break;
            default:
                result = [];
                for (var i = 0; i < params.length && i < numberOfParams; i++) {
                    result.push(undefinedToNull(params[i]));
                }
                if (params.length < numberOfParams) {
                    for (var i = params.length; i < numberOfParams; i++) {
                        result.push(null);
                    }
                }
                break;
        }
        return result;
    }
    var connection = {
        sendNotification: function (type) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            throwIfClosedOrDisposed();
            var method;
            var messageParams;
            if (Is.string(type)) {
                method = type;
                switch (params.length) {
                    case 0:
                        messageParams = null;
                        break;
                    case 1:
                        messageParams = params[0];
                        break;
                    default:
                        messageParams = params;
                        break;
                }
            }
            else {
                method = type.method;
                messageParams = computeMessageParams(type, params);
            }
            var notificationMessage = {
                jsonrpc: version,
                method: method,
                params: messageParams
            };
            traceSendNotification(notificationMessage);
            messageWriter.write(notificationMessage);
        },
        onNotification: function (type, handler) {
            throwIfClosedOrDisposed();
            if (Is.func(type)) {
                starNotificationHandler = type;
            }
            else if (handler) {
                if (Is.string(type)) {
                    notificationHandlers[type] = { type: undefined, handler: handler };
                }
                else {
                    notificationHandlers[type.method] = { type: type, handler: handler };
                }
            }
        },
        sendRequest: function (type) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            throwIfClosedOrDisposed();
            throwIfNotListening();
            var method;
            var messageParams;
            var token = undefined;
            if (Is.string(type)) {
                method = type;
                switch (params.length) {
                    case 0:
                        messageParams = null;
                        break;
                    case 1:
                        // The cancellation token is optional so it can also be undefined.
                        if (cancellation_1.CancellationToken.is(params[0])) {
                            messageParams = null;
                            token = params[0];
                        }
                        else {
                            messageParams = undefinedToNull(params[0]);
                        }
                        break;
                    default:
                        var last = params.length - 1;
                        if (cancellation_1.CancellationToken.is(params[last])) {
                            token = params[last];
                            if (params.length === 2) {
                                messageParams = undefinedToNull(params[0]);
                            }
                            else {
                                messageParams = params.slice(0, last).map(function (value) { return undefinedToNull(value); });
                            }
                        }
                        else {
                            messageParams = params.map(function (value) { return undefinedToNull(value); });
                        }
                        break;
                }
            }
            else {
                method = type.method;
                messageParams = computeMessageParams(type, params);
                var numberOfParams = type.numberOfParams;
                token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : undefined;
            }
            var id = sequenceNumber++;
            var result = new Promise(function (resolve, reject) {
                var requestMessage = {
                    jsonrpc: version,
                    id: id,
                    method: method,
                    params: messageParams
                };
                var responsePromise = { method: method, timerStart: Date.now(), resolve: resolve, reject: reject };
                traceSendingRequest(requestMessage);
                try {
                    messageWriter.write(requestMessage);
                }
                catch (e) {
                    // Writing the message failed. So we need to reject the promise.
                    responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, e.message ? e.message : 'Unknown reason'));
                    responsePromise = null;
                }
                if (responsePromise) {
                    responsePromises[String(id)] = responsePromise;
                }
            });
            if (token) {
                token.onCancellationRequested(function () {
                    connection.sendNotification(CancelNotification.type, { id: id });
                });
            }
            return result;
        },
        onRequest: function (type, handler) {
            throwIfClosedOrDisposed();
            if (Is.func(type)) {
                starRequestHandler = type;
            }
            else if (handler) {
                if (Is.string(type)) {
                    requestHandlers[type] = { type: undefined, handler: handler };
                }
                else {
                    requestHandlers[type.method] = { type: type, handler: handler };
                }
            }
        },
        trace: function (_value, _tracer, sendNotification) {
            if (sendNotification === void 0) { sendNotification = false; }
            trace = _value;
            if (trace === Trace.Off) {
                tracer = undefined;
            }
            else {
                tracer = _tracer;
            }
            if (sendNotification && !isClosed() && !isDisposed()) {
                connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
            }
        },
        onError: errorEmitter.event,
        onClose: closeEmitter.event,
        onUnhandledNotification: unhandledNotificationEmitter.event,
        onDispose: disposeEmitter.event,
        dispose: function () {
            if (isDisposed()) {
                return;
            }
            state = ConnectionState.Disposed;
            disposeEmitter.fire(undefined);
            var error = new Error('Connection got disposed.');
            Object.keys(responsePromises).forEach(function (key) {
                responsePromises[key].reject(error);
            });
            responsePromises = Object.create(null);
            requestTokens = Object.create(null);
            messageQueue = new linkedMap_1.LinkedMap();
            // Test for backwards compatibility
            if (Is.func(messageWriter.dispose)) {
                messageWriter.dispose();
            }
            if (Is.func(messageReader.dispose)) {
                messageReader.dispose();
            }
        },
        listen: function () {
            throwIfClosedOrDisposed();
            throwIfListening();
            state = ConnectionState.Listening;
            messageReader.listen(callback);
        },
        inspect: function () {
            console.log("inspect");
        }
    };
    connection.onNotification(LogTraceNotification.type, function (params) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        tracer.log(params.message, trace === Trace.Verbose ? params.verbose : undefined);
    });
    return connection;
}
function isMessageReader(value) {
    return value.listen !== void 0 && value.read === void 0;
}
function isMessageWriter(value) {
    return value.write !== void 0 && value.end === void 0;
}
function createMessageConnection(input, output, logger, strategy) {
    if (!logger) {
        logger = exports.NullLogger;
    }
    var reader = isMessageReader(input) ? input : new messageReader_1.StreamMessageReader(input);
    var writer = isMessageWriter(output) ? output : new messageWriter_1.StreamMessageWriter(output);
    return _createMessageConnection(reader, writer, logger, strategy);
}
exports.createMessageConnection = createMessageConnection;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageReader.js":
/*!***************************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageReader.js ***!
  \***************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = __webpack_require__(/*! ./events */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/events.js");
var Is = __webpack_require__(/*! ./is */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js");
var DefaultSize = 8192;
var CR = new Buffer('\r', 'ascii')[0];
var LF = new Buffer('\n', 'ascii')[0];
var CRLF = '\r\n';
var MessageBuffer = /** @class */ (function () {
    function MessageBuffer(encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        this.encoding = encoding;
        this.index = 0;
        this.buffer = new Buffer(DefaultSize);
    }
    MessageBuffer.prototype.append = function (chunk) {
        var toAppend = chunk;
        if (typeof (chunk) === 'string') {
            var str = chunk;
            var bufferLen = Buffer.byteLength(str, this.encoding);
            toAppend = new Buffer(bufferLen);
            toAppend.write(str, 0, bufferLen, this.encoding);
        }
        if (this.buffer.length - this.index >= toAppend.length) {
            toAppend.copy(this.buffer, this.index, 0, toAppend.length);
        }
        else {
            var newSize = (Math.ceil((this.index + toAppend.length) / DefaultSize) + 1) * DefaultSize;
            if (this.index === 0) {
                this.buffer = new Buffer(newSize);
                toAppend.copy(this.buffer, 0, 0, toAppend.length);
            }
            else {
                this.buffer = Buffer.concat([this.buffer.slice(0, this.index), toAppend], newSize);
            }
        }
        this.index += toAppend.length;
    };
    MessageBuffer.prototype.tryReadHeaders = function () {
        var result = undefined;
        var current = 0;
        while (current + 3 < this.index && (this.buffer[current] !== CR || this.buffer[current + 1] !== LF || this.buffer[current + 2] !== CR || this.buffer[current + 3] !== LF)) {
            current++;
        }
        // No header / body separator found (e.g CRLFCRLF)
        if (current + 3 >= this.index) {
            return result;
        }
        result = Object.create(null);
        var headers = this.buffer.toString('ascii', 0, current).split(CRLF);
        headers.forEach(function (header) {
            var index = header.indexOf(':');
            if (index === -1) {
                throw new Error('Message header must separate key and value using :');
            }
            var key = header.substr(0, index);
            var value = header.substr(index + 1).trim();
            result[key] = value;
        });
        var nextStart = current + 4;
        this.buffer = this.buffer.slice(nextStart);
        this.index = this.index - nextStart;
        return result;
    };
    MessageBuffer.prototype.tryReadContent = function (length) {
        if (this.index < length) {
            return null;
        }
        var result = this.buffer.toString(this.encoding, 0, length);
        var nextStart = length;
        this.buffer.copy(this.buffer, 0, nextStart);
        this.index = this.index - nextStart;
        return result;
    };
    Object.defineProperty(MessageBuffer.prototype, "numberOfBytes", {
        get: function () {
            return this.index;
        },
        enumerable: true,
        configurable: true
    });
    return MessageBuffer;
}());
var MessageReader;
(function (MessageReader) {
    function is(value) {
        var candidate = value;
        return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) &&
            Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
    }
    MessageReader.is = is;
})(MessageReader = exports.MessageReader || (exports.MessageReader = {}));
var AbstractMessageReader = /** @class */ (function () {
    function AbstractMessageReader() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
        this.partialMessageEmitter = new events_1.Emitter();
    }
    AbstractMessageReader.prototype.dispose = function () {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
    };
    Object.defineProperty(AbstractMessageReader.prototype, "onError", {
        get: function () {
            return this.errorEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    AbstractMessageReader.prototype.fireError = function (error) {
        this.errorEmitter.fire(this.asError(error));
    };
    Object.defineProperty(AbstractMessageReader.prototype, "onClose", {
        get: function () {
            return this.closeEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    AbstractMessageReader.prototype.fireClose = function () {
        this.closeEmitter.fire(undefined);
    };
    Object.defineProperty(AbstractMessageReader.prototype, "onPartialMessage", {
        get: function () {
            return this.partialMessageEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    AbstractMessageReader.prototype.firePartialMessage = function (info) {
        this.partialMessageEmitter.fire(info);
    };
    AbstractMessageReader.prototype.asError = function (error) {
        if (error instanceof Error) {
            return error;
        }
        else {
            return new Error("Reader recevied error. Reason: " + (Is.string(error.message) ? error.message : 'unknown'));
        }
    };
    return AbstractMessageReader;
}());
exports.AbstractMessageReader = AbstractMessageReader;
var StreamMessageReader = /** @class */ (function (_super) {
    __extends(StreamMessageReader, _super);
    function StreamMessageReader(readable, encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        var _this = _super.call(this) || this;
        _this.readable = readable;
        _this.buffer = new MessageBuffer(encoding);
        _this._partialMessageTimeout = 10000;
        return _this;
    }
    Object.defineProperty(StreamMessageReader.prototype, "partialMessageTimeout", {
        get: function () {
            return this._partialMessageTimeout;
        },
        set: function (timeout) {
            this._partialMessageTimeout = timeout;
        },
        enumerable: true,
        configurable: true
    });
    StreamMessageReader.prototype.listen = function (callback) {
        var _this = this;
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.partialMessageTimer = undefined;
        this.callback = callback;
        this.readable.on('data', function (data) {
            _this.onData(data);
        });
        this.readable.on('error', function (error) { return _this.fireError(error); });
        this.readable.on('close', function () { return _this.fireClose(); });
    };
    StreamMessageReader.prototype.onData = function (data) {
        this.buffer.append(data);
        while (true) {
            if (this.nextMessageLength === -1) {
                var headers = this.buffer.tryReadHeaders();
                if (!headers) {
                    return;
                }
                var contentLength = headers['Content-Length'];
                if (!contentLength) {
                    throw new Error('Header must provide a Content-Length property.');
                }
                var length = parseInt(contentLength);
                if (isNaN(length)) {
                    throw new Error('Content-Length value must be a number.');
                }
                this.nextMessageLength = length;
                // Take the encoding form the header. For compatibility
                // treat both utf-8 and utf8 as node utf8
            }
            var msg = this.buffer.tryReadContent(this.nextMessageLength);
            if (msg === null) {
                /** We haven't recevied the full message yet. */
                this.setPartialMessageTimer();
                return;
            }
            this.clearPartialMessageTimer();
            this.nextMessageLength = -1;
            this.messageToken++;
            var json = JSON.parse(msg);
            this.callback(json);
        }
    };
    StreamMessageReader.prototype.clearPartialMessageTimer = function () {
        if (this.partialMessageTimer) {
            clearTimeout(this.partialMessageTimer);
            this.partialMessageTimer = undefined;
        }
    };
    StreamMessageReader.prototype.setPartialMessageTimer = function () {
        var _this = this;
        this.clearPartialMessageTimer();
        if (this._partialMessageTimeout <= 0) {
            return;
        }
        this.partialMessageTimer = setTimeout(function (token, timeout) {
            _this.partialMessageTimer = undefined;
            if (token === _this.messageToken) {
                _this.firePartialMessage({ messageToken: token, waitingTime: timeout });
                _this.setPartialMessageTimer();
            }
        }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
    };
    return StreamMessageReader;
}(AbstractMessageReader));
exports.StreamMessageReader = StreamMessageReader;
var IPCMessageReader = /** @class */ (function (_super) {
    __extends(IPCMessageReader, _super);
    function IPCMessageReader(process) {
        var _this = _super.call(this) || this;
        _this.process = process;
        var eventEmitter = _this.process;
        eventEmitter.on('error', function (error) { return _this.fireError(error); });
        eventEmitter.on('close', function () { return _this.fireClose(); });
        return _this;
    }
    IPCMessageReader.prototype.listen = function (callback) {
        this.process.on('message', callback);
    };
    return IPCMessageReader;
}(AbstractMessageReader));
exports.IPCMessageReader = IPCMessageReader;
var SocketMessageReader = /** @class */ (function (_super) {
    __extends(SocketMessageReader, _super);
    function SocketMessageReader(socket, encoding) {
        if (encoding === void 0) { encoding = 'utf-8'; }
        return _super.call(this, socket, encoding) || this;
    }
    return SocketMessageReader;
}(StreamMessageReader));
exports.SocketMessageReader = SocketMessageReader;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageWriter.js":
/*!***************************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageWriter.js ***!
  \***************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = __webpack_require__(/*! ./events */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/events.js");
var Is = __webpack_require__(/*! ./is */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js");
var ContentLength = 'Content-Length: ';
var CRLF = '\r\n';
var MessageWriter;
(function (MessageWriter) {
    function is(value) {
        var candidate = value;
        return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) &&
            Is.func(candidate.onError) && Is.func(candidate.write);
    }
    MessageWriter.is = is;
})(MessageWriter = exports.MessageWriter || (exports.MessageWriter = {}));
var AbstractMessageWriter = /** @class */ (function () {
    function AbstractMessageWriter() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
    }
    AbstractMessageWriter.prototype.dispose = function () {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
    };
    Object.defineProperty(AbstractMessageWriter.prototype, "onError", {
        get: function () {
            return this.errorEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    AbstractMessageWriter.prototype.fireError = function (error, message, count) {
        this.errorEmitter.fire([this.asError(error), message, count]);
    };
    Object.defineProperty(AbstractMessageWriter.prototype, "onClose", {
        get: function () {
            return this.closeEmitter.event;
        },
        enumerable: true,
        configurable: true
    });
    AbstractMessageWriter.prototype.fireClose = function () {
        this.closeEmitter.fire(undefined);
    };
    AbstractMessageWriter.prototype.asError = function (error) {
        if (error instanceof Error) {
            return error;
        }
        else {
            return new Error("Writer recevied error. Reason: " + (Is.string(error.message) ? error.message : 'unknown'));
        }
    };
    return AbstractMessageWriter;
}());
exports.AbstractMessageWriter = AbstractMessageWriter;
var StreamMessageWriter = /** @class */ (function (_super) {
    __extends(StreamMessageWriter, _super);
    function StreamMessageWriter(writable, encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        var _this = _super.call(this) || this;
        _this.writable = writable;
        _this.encoding = encoding;
        _this.errorCount = 0;
        _this.writable.on('error', function (error) { return _this.fireError(error); });
        _this.writable.on('close', function () { return _this.fireClose(); });
        return _this;
    }
    StreamMessageWriter.prototype.write = function (msg) {
        var json = JSON.stringify(msg);
        var contentLength = Buffer.byteLength(json, this.encoding);
        var headers = [
            ContentLength, contentLength.toString(), CRLF,
            CRLF
        ];
        try {
            // Header must be written in ASCII encoding
            this.writable.write(headers.join(''), 'ascii');
            // Now write the content. This can be written in any encoding
            this.writable.write(json, this.encoding);
            this.errorCount = 0;
        }
        catch (error) {
            this.errorCount++;
            this.fireError(error, msg, this.errorCount);
        }
    };
    return StreamMessageWriter;
}(AbstractMessageWriter));
exports.StreamMessageWriter = StreamMessageWriter;
var IPCMessageWriter = /** @class */ (function (_super) {
    __extends(IPCMessageWriter, _super);
    function IPCMessageWriter(process) {
        var _this = _super.call(this) || this;
        _this.process = process;
        _this.errorCount = 0;
        _this.queue = [];
        _this.sending = false;
        var eventEmitter = _this.process;
        eventEmitter.on('error', function (error) { return _this.fireError(error); });
        eventEmitter.on('close', function () { return _this.fireClose; });
        return _this;
    }
    IPCMessageWriter.prototype.write = function (msg) {
        if (!this.sending && this.queue.length === 0) {
            // See https://github.com/nodejs/node/issues/7657
            this.doWriteMessage(msg);
        }
        else {
            this.queue.push(msg);
        }
    };
    IPCMessageWriter.prototype.doWriteMessage = function (msg) {
        var _this = this;
        try {
            if (this.process.send) {
                this.sending = true;
                this.process.send(msg, undefined, undefined, function (error) {
                    _this.sending = false;
                    if (error) {
                        _this.errorCount++;
                        _this.fireError(error, msg, _this.errorCount);
                    }
                    else {
                        _this.errorCount = 0;
                    }
                    if (_this.queue.length > 0) {
                        _this.doWriteMessage(_this.queue.shift());
                    }
                });
            }
        }
        catch (error) {
            this.errorCount++;
            this.fireError(error, msg, this.errorCount);
        }
    };
    return IPCMessageWriter;
}(AbstractMessageWriter));
exports.IPCMessageWriter = IPCMessageWriter;
var SocketMessageWriter = /** @class */ (function (_super) {
    __extends(SocketMessageWriter, _super);
    function SocketMessageWriter(socket, encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        var _this = _super.call(this) || this;
        _this.socket = socket;
        _this.queue = [];
        _this.sending = false;
        _this.encoding = encoding;
        _this.errorCount = 0;
        _this.socket.on('error', function (error) { return _this.fireError(error); });
        _this.socket.on('close', function () { return _this.fireClose(); });
        return _this;
    }
    SocketMessageWriter.prototype.write = function (msg) {
        if (!this.sending && this.queue.length === 0) {
            // See https://github.com/nodejs/node/issues/7657
            this.doWriteMessage(msg);
        }
        else {
            this.queue.push(msg);
        }
    };
    SocketMessageWriter.prototype.doWriteMessage = function (msg) {
        var _this = this;
        var json = JSON.stringify(msg);
        var contentLength = Buffer.byteLength(json, this.encoding);
        var headers = [
            ContentLength, contentLength.toString(), CRLF,
            CRLF
        ];
        try {
            // Header must be written in ASCII encoding
            this.sending = true;
            this.socket.write(headers.join(''), 'ascii', function (error) {
                if (error) {
                    _this.handleError(error, msg);
                }
                try {
                    // Now write the content. This can be written in any encoding
                    _this.socket.write(json, _this.encoding, function (error) {
                        _this.sending = false;
                        if (error) {
                            _this.handleError(error, msg);
                        }
                        else {
                            _this.errorCount = 0;
                        }
                        if (_this.queue.length > 0) {
                            _this.doWriteMessage(_this.queue.shift());
                        }
                    });
                }
                catch (error) {
                    _this.handleError(error, msg);
                }
            });
        }
        catch (error) {
            this.handleError(error, msg);
        }
    };
    SocketMessageWriter.prototype.handleError = function (error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
    };
    return SocketMessageWriter;
}(AbstractMessageWriter));
exports.SocketMessageWriter = SocketMessageWriter;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messages.js":
/*!**********************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messages.js ***!
  \**********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var is = __webpack_require__(/*! ./is */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/is.js");
/**
 * Predefined error codes.
 */
var ErrorCodes;
(function (ErrorCodes) {
    // Defined by JSON RPC
    ErrorCodes.ParseError = -32700;
    ErrorCodes.InvalidRequest = -32600;
    ErrorCodes.MethodNotFound = -32601;
    ErrorCodes.InvalidParams = -32602;
    ErrorCodes.InternalError = -32603;
    ErrorCodes.serverErrorStart = -32099;
    ErrorCodes.serverErrorEnd = -32000;
    ErrorCodes.ServerNotInitialized = -32002;
    ErrorCodes.UnknownErrorCode = -32001;
    // Defined by the protocol.
    ErrorCodes.RequestCancelled = -32800;
    // Defined by VSCode library.
    ErrorCodes.MessageWriteError = 1;
    ErrorCodes.MessageReadError = 2;
})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));
/**
 * An error object return in a response in case a request
 * has failed.
 */
var ResponseError = /** @class */ (function (_super) {
    __extends(ResponseError, _super);
    function ResponseError(code, message, data) {
        var _this = _super.call(this, message) || this;
        _this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
        _this.data = data;
        Object.setPrototypeOf(_this, ResponseError.prototype);
        return _this;
    }
    ResponseError.prototype.toJson = function () {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
        };
    };
    return ResponseError;
}(Error));
exports.ResponseError = ResponseError;
/**
 * An abstract implementation of a MessageType.
 */
var AbstractMessageType = /** @class */ (function () {
    function AbstractMessageType(_method, _numberOfParams) {
        this._method = _method;
        this._numberOfParams = _numberOfParams;
    }
    Object.defineProperty(AbstractMessageType.prototype, "method", {
        get: function () {
            return this._method;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AbstractMessageType.prototype, "numberOfParams", {
        get: function () {
            return this._numberOfParams;
        },
        enumerable: true,
        configurable: true
    });
    return AbstractMessageType;
}());
exports.AbstractMessageType = AbstractMessageType;
/**
 * Classes to type request response pairs
 */
var RequestType0 = /** @class */ (function (_super) {
    __extends(RequestType0, _super);
    function RequestType0(method) {
        var _this = _super.call(this, method, 0) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType0;
}(AbstractMessageType));
exports.RequestType0 = RequestType0;
var RequestType = /** @class */ (function (_super) {
    __extends(RequestType, _super);
    function RequestType(method) {
        var _this = _super.call(this, method, 1) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType;
}(AbstractMessageType));
exports.RequestType = RequestType;
var RequestType1 = /** @class */ (function (_super) {
    __extends(RequestType1, _super);
    function RequestType1(method) {
        var _this = _super.call(this, method, 1) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType1;
}(AbstractMessageType));
exports.RequestType1 = RequestType1;
var RequestType2 = /** @class */ (function (_super) {
    __extends(RequestType2, _super);
    function RequestType2(method) {
        var _this = _super.call(this, method, 2) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType2;
}(AbstractMessageType));
exports.RequestType2 = RequestType2;
var RequestType3 = /** @class */ (function (_super) {
    __extends(RequestType3, _super);
    function RequestType3(method) {
        var _this = _super.call(this, method, 3) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType3;
}(AbstractMessageType));
exports.RequestType3 = RequestType3;
var RequestType4 = /** @class */ (function (_super) {
    __extends(RequestType4, _super);
    function RequestType4(method) {
        var _this = _super.call(this, method, 4) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType4;
}(AbstractMessageType));
exports.RequestType4 = RequestType4;
var RequestType5 = /** @class */ (function (_super) {
    __extends(RequestType5, _super);
    function RequestType5(method) {
        var _this = _super.call(this, method, 5) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType5;
}(AbstractMessageType));
exports.RequestType5 = RequestType5;
var RequestType6 = /** @class */ (function (_super) {
    __extends(RequestType6, _super);
    function RequestType6(method) {
        var _this = _super.call(this, method, 6) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType6;
}(AbstractMessageType));
exports.RequestType6 = RequestType6;
var RequestType7 = /** @class */ (function (_super) {
    __extends(RequestType7, _super);
    function RequestType7(method) {
        var _this = _super.call(this, method, 7) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType7;
}(AbstractMessageType));
exports.RequestType7 = RequestType7;
var RequestType8 = /** @class */ (function (_super) {
    __extends(RequestType8, _super);
    function RequestType8(method) {
        var _this = _super.call(this, method, 8) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType8;
}(AbstractMessageType));
exports.RequestType8 = RequestType8;
var RequestType9 = /** @class */ (function (_super) {
    __extends(RequestType9, _super);
    function RequestType9(method) {
        var _this = _super.call(this, method, 9) || this;
        _this._ = undefined;
        return _this;
    }
    return RequestType9;
}(AbstractMessageType));
exports.RequestType9 = RequestType9;
var NotificationType = /** @class */ (function (_super) {
    __extends(NotificationType, _super);
    function NotificationType(method) {
        var _this = _super.call(this, method, 1) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType;
}(AbstractMessageType));
exports.NotificationType = NotificationType;
var NotificationType0 = /** @class */ (function (_super) {
    __extends(NotificationType0, _super);
    function NotificationType0(method) {
        var _this = _super.call(this, method, 0) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType0;
}(AbstractMessageType));
exports.NotificationType0 = NotificationType0;
var NotificationType1 = /** @class */ (function (_super) {
    __extends(NotificationType1, _super);
    function NotificationType1(method) {
        var _this = _super.call(this, method, 1) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType1;
}(AbstractMessageType));
exports.NotificationType1 = NotificationType1;
var NotificationType2 = /** @class */ (function (_super) {
    __extends(NotificationType2, _super);
    function NotificationType2(method) {
        var _this = _super.call(this, method, 2) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType2;
}(AbstractMessageType));
exports.NotificationType2 = NotificationType2;
var NotificationType3 = /** @class */ (function (_super) {
    __extends(NotificationType3, _super);
    function NotificationType3(method) {
        var _this = _super.call(this, method, 3) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType3;
}(AbstractMessageType));
exports.NotificationType3 = NotificationType3;
var NotificationType4 = /** @class */ (function (_super) {
    __extends(NotificationType4, _super);
    function NotificationType4(method) {
        var _this = _super.call(this, method, 4) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType4;
}(AbstractMessageType));
exports.NotificationType4 = NotificationType4;
var NotificationType5 = /** @class */ (function (_super) {
    __extends(NotificationType5, _super);
    function NotificationType5(method) {
        var _this = _super.call(this, method, 5) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType5;
}(AbstractMessageType));
exports.NotificationType5 = NotificationType5;
var NotificationType6 = /** @class */ (function (_super) {
    __extends(NotificationType6, _super);
    function NotificationType6(method) {
        var _this = _super.call(this, method, 6) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType6;
}(AbstractMessageType));
exports.NotificationType6 = NotificationType6;
var NotificationType7 = /** @class */ (function (_super) {
    __extends(NotificationType7, _super);
    function NotificationType7(method) {
        var _this = _super.call(this, method, 7) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType7;
}(AbstractMessageType));
exports.NotificationType7 = NotificationType7;
var NotificationType8 = /** @class */ (function (_super) {
    __extends(NotificationType8, _super);
    function NotificationType8(method) {
        var _this = _super.call(this, method, 8) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType8;
}(AbstractMessageType));
exports.NotificationType8 = NotificationType8;
var NotificationType9 = /** @class */ (function (_super) {
    __extends(NotificationType9, _super);
    function NotificationType9(method) {
        var _this = _super.call(this, method, 9) || this;
        _this._ = undefined;
        return _this;
    }
    return NotificationType9;
}(AbstractMessageType));
exports.NotificationType9 = NotificationType9;
/**
 * Tests if the given message is a request message
 */
function isRequestMessage(message) {
    var candidate = message;
    return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
}
exports.isRequestMessage = isRequestMessage;
/**
 * Tests if the given message is a notification message
 */
function isNotificationMessage(message) {
    var candidate = message;
    return candidate && is.string(candidate.method) && message.id === void 0;
}
exports.isNotificationMessage = isNotificationMessage;
/**
 * Tests if the given message is a response message
 */
function isResponseMessage(message) {
    var candidate = message;
    return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
}
exports.isResponseMessage = isResponseMessage;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/pipeSupport.js":
/*!*************************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/pipeSupport.js ***!
  \*************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __webpack_require__(/*! path */ "path");
var os_1 = __webpack_require__(/*! os */ "os");
var crypto_1 = __webpack_require__(/*! crypto */ "crypto");
var net_1 = __webpack_require__(/*! net */ "net");
var messageReader_1 = __webpack_require__(/*! ./messageReader */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageReader.js");
var messageWriter_1 = __webpack_require__(/*! ./messageWriter */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageWriter.js");
function generateRandomPipeName() {
    var randomSuffix = crypto_1.randomBytes(21).toString('hex');
    if (process.platform === 'win32') {
        return "\\\\.\\pipe\\vscode-jsonrpc-" + randomSuffix + "-sock";
    }
    else {
        // Mac/Unix: use socket file
        return path_1.join(os_1.tmpdir(), "vscode-" + randomSuffix + ".sock");
    }
}
exports.generateRandomPipeName = generateRandomPipeName;
function createClientPipeTransport(pipeName, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    var connectResolve;
    var connected = new Promise(function (resolve, _reject) {
        connectResolve = resolve;
    });
    return new Promise(function (resolve, reject) {
        var server = net_1.createServer(function (socket) {
            server.close();
            connectResolve([
                new messageReader_1.SocketMessageReader(socket, encoding),
                new messageWriter_1.SocketMessageWriter(socket, encoding)
            ]);
        });
        server.on('error', reject);
        server.listen(pipeName, function () {
            server.removeListener('error', reject);
            resolve({
                onConnected: function () { return connected; }
            });
        });
    });
}
exports.createClientPipeTransport = createClientPipeTransport;
function createServerPipeTransport(pipeName, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    var socket = net_1.createConnection(pipeName);
    return [
        new messageReader_1.SocketMessageReader(socket, encoding),
        new messageWriter_1.SocketMessageWriter(socket, encoding)
    ];
}
exports.createServerPipeTransport = createServerPipeTransport;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/socketSupport.js":
/*!***************************************************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/socketSupport.js ***!
  \***************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = __webpack_require__(/*! net */ "net");
var messageReader_1 = __webpack_require__(/*! ./messageReader */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageReader.js");
var messageWriter_1 = __webpack_require__(/*! ./messageWriter */ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-protocol/node_modules/vscode-jsonrpc/lib/messageWriter.js");
function createClientSocketTransport(port, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    var connectResolve;
    var connected = new Promise(function (resolve, _reject) {
        connectResolve = resolve;
    });
    return new Promise(function (resolve, reject) {
        var server = net_1.createServer(function (socket) {
            server.close();
            connectResolve([
                new messageReader_1.SocketMessageReader(socket, encoding),
                new messageWriter_1.SocketMessageWriter(socket, encoding)
            ]);
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', function () {
            server.removeListener('error', reject);
            resolve({
                onConnected: function () { return connected; }
            });
        });
    });
}
exports.createClientSocketTransport = createClientSocketTransport;
function createServerSocketTransport(port, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    var socket = net_1.createConnection(port, '127.0.0.1');
    return [
        new messageReader_1.SocketMessageReader(socket, encoding),
        new messageWriter_1.SocketMessageWriter(socket, encoding)
    ];
}
exports.createServerSocketTransport = createServerSocketTransport;


/***/ }),

/***/ "./node_modules/atom-languageclient/node_modules/vscode-languageserver-types/lib/esm/main.js":
/*!***************************************************************************************************!*\
  !*** ./node_modules/atom-languageclient/node_modules/vscode-languageserver-types/lib/esm/main.js ***!
  \***************************************************************************************************/
/*! exports provided: Position, Range, Location, Color, ColorInformation, ColorPresentation, FoldingRangeKind, FoldingRange, DiagnosticRelatedInformation, DiagnosticSeverity, Diagnostic, Command, TextEdit, TextDocumentEdit, WorkspaceEdit, WorkspaceChange, TextDocumentIdentifier, VersionedTextDocumentIdentifier, TextDocumentItem, MarkupKind, MarkupContent, CompletionItemKind, InsertTextFormat, CompletionItem, CompletionList, MarkedString, Hover, ParameterInformation, SignatureInformation, DocumentHighlightKind, DocumentHighlight, SymbolKind, SymbolInformation, DocumentSymbol, CodeActionKind, CodeActionContext, CodeAction, CodeLens, FormattingOptions, DocumentLink, EOL, TextDocument, TextDocumentSaveReason */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Position", function() { return Position; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Range", function() { return Range; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Location", function() { return Location; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Color", function() { return Color; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ColorInformation", function() { return ColorInformation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ColorPresentation", function() { return ColorPresentation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FoldingRangeKind", function() { return FoldingRangeKind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FoldingRange", function() { return FoldingRange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DiagnosticRelatedInformation", function() { return DiagnosticRelatedInformation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DiagnosticSeverity", function() { return DiagnosticSeverity; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Diagnostic", function() { return Diagnostic; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Command", function() { return Command; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextEdit", function() { return TextEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextDocumentEdit", function() { return TextDocumentEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WorkspaceEdit", function() { return WorkspaceEdit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WorkspaceChange", function() { return WorkspaceChange; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextDocumentIdentifier", function() { return TextDocumentIdentifier; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "VersionedTextDocumentIdentifier", function() { return VersionedTextDocumentIdentifier; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextDocumentItem", function() { return TextDocumentItem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MarkupKind", function() { return MarkupKind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MarkupContent", function() { return MarkupContent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CompletionItemKind", function() { return CompletionItemKind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "InsertTextFormat", function() { return InsertTextFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CompletionItem", function() { return CompletionItem; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CompletionList", function() { return CompletionList; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MarkedString", function() { return MarkedString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Hover", function() { return Hover; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ParameterInformation", function() { return ParameterInformation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SignatureInformation", function() { return SignatureInformation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DocumentHighlightKind", function() { return DocumentHighlightKind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DocumentHighlight", function() { return DocumentHighlight; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SymbolKind", function() { return SymbolKind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SymbolInformation", function() { return SymbolInformation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DocumentSymbol", function() { return DocumentSymbol; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CodeActionKind", function() { return CodeActionKind; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CodeActionContext", function() { return CodeActionContext; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CodeAction", function() { return CodeAction; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CodeLens", function() { return CodeLens; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattingOptions", function() { return FormattingOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DocumentLink", function() { return DocumentLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "EOL", function() { return EOL; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextDocument", function() { return TextDocument; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TextDocumentSaveReason", function() { return TextDocumentSaveReason; });
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

/**
 * The Position namespace provides helper functions to work with
 * [Position](#Position) literals.
 */
var Position;
(function (Position) {
    /**
     * Creates a new Position literal from the given line and character.
     * @param line The position's line.
     * @param character The position's character.
     */
    function create(line, character) {
        return { line: line, character: character };
    }
    Position.create = create;
    /**
     * Checks whether the given liternal conforms to the [Position](#Position) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Is.number(candidate.line) && Is.number(candidate.character);
    }
    Position.is = is;
})(Position || (Position = {}));
/**
 * The Range namespace provides helper functions to work with
 * [Range](#Range) literals.
 */
var Range;
(function (Range) {
    function create(one, two, three, four) {
        if (Is.number(one) && Is.number(two) && Is.number(three) && Is.number(four)) {
            return { start: Position.create(one, two), end: Position.create(three, four) };
        }
        else if (Position.is(one) && Position.is(two)) {
            return { start: one, end: two };
        }
        else {
            throw new Error("Range#create called with invalid arguments[" + one + ", " + two + ", " + three + ", " + four + "]");
        }
    }
    Range.create = create;
    /**
     * Checks whether the given literal conforms to the [Range](#Range) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && Position.is(candidate.start) && Position.is(candidate.end);
    }
    Range.is = is;
})(Range || (Range = {}));
/**
 * The Location namespace provides helper functions to work with
 * [Location](#Location) literals.
 */
var Location;
(function (Location) {
    /**
     * Creates a Location literal.
     * @param uri The location's uri.
     * @param range The location's range.
     */
    function create(uri, range) {
        return { uri: uri, range: range };
    }
    Location.create = create;
    /**
     * Checks whether the given literal conforms to the [Location](#Location) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
    }
    Location.is = is;
})(Location || (Location = {}));
/**
 * The Color namespace provides helper functions to work with
 * [Color](#Color) literals.
 */
var Color;
(function (Color) {
    /**
     * Creates a new Color literal.
     */
    function create(red, green, blue, alpha) {
        return {
            red: red,
            green: green,
            blue: blue,
            alpha: alpha,
        };
    }
    Color.create = create;
    /**
     * Checks whether the given literal conforms to the [Color](#Color) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.number(candidate.red)
            && Is.number(candidate.green)
            && Is.number(candidate.blue)
            && Is.number(candidate.alpha);
    }
    Color.is = is;
})(Color || (Color = {}));
/**
 * The ColorInformation namespace provides helper functions to work with
 * [ColorInformation](#ColorInformation) literals.
 */
var ColorInformation;
(function (ColorInformation) {
    /**
     * Creates a new ColorInformation literal.
     */
    function create(range, color) {
        return {
            range: range,
            color: color,
        };
    }
    ColorInformation.create = create;
    /**
     * Checks whether the given literal conforms to the [ColorInformation](#ColorInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Range.is(candidate.range) && Color.is(candidate.color);
    }
    ColorInformation.is = is;
})(ColorInformation || (ColorInformation = {}));
/**
 * The Color namespace provides helper functions to work with
 * [ColorPresentation](#ColorPresentation) literals.
 */
var ColorPresentation;
(function (ColorPresentation) {
    /**
     * Creates a new ColorInformation literal.
     */
    function create(label, textEdit, additionalTextEdits) {
        return {
            label: label,
            textEdit: textEdit,
            additionalTextEdits: additionalTextEdits,
        };
    }
    ColorPresentation.create = create;
    /**
     * Checks whether the given literal conforms to the [ColorInformation](#ColorInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.string(candidate.label)
            && (Is.undefined(candidate.textEdit) || TextEdit.is(candidate))
            && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit.is));
    }
    ColorPresentation.is = is;
})(ColorPresentation || (ColorPresentation = {}));
/**
 * Enum of known range kinds
 */
var FoldingRangeKind;
(function (FoldingRangeKind) {
    /**
     * Folding range for a comment
     */
    FoldingRangeKind["Comment"] = "comment";
    /**
     * Folding range for a imports or includes
     */
    FoldingRangeKind["Imports"] = "imports";
    /**
     * Folding range for a region (e.g. `#region`)
     */
    FoldingRangeKind["Region"] = "region";
})(FoldingRangeKind || (FoldingRangeKind = {}));
/**
 * The folding range namespace provides helper functions to work with
 * [FoldingRange](#FoldingRange) literals.
 */
var FoldingRange;
(function (FoldingRange) {
    /**
     * Creates a new FoldingRange literal.
     */
    function create(startLine, endLine, startCharacter, endCharacter, kind) {
        var result = {
            startLine: startLine,
            endLine: endLine
        };
        if (Is.defined(startCharacter)) {
            result.startCharacter = startCharacter;
        }
        if (Is.defined(endCharacter)) {
            result.endCharacter = endCharacter;
        }
        if (Is.defined(kind)) {
            result.kind = kind;
        }
        return result;
    }
    FoldingRange.create = create;
    /**
     * Checks whether the given literal conforms to the [FoldingRange](#FoldingRange) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.number(candidate.startLine) && Is.number(candidate.startLine)
            && (Is.undefined(candidate.startCharacter) || Is.number(candidate.startCharacter))
            && (Is.undefined(candidate.endCharacter) || Is.number(candidate.endCharacter))
            && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
    }
    FoldingRange.is = is;
})(FoldingRange || (FoldingRange = {}));
/**
 * The DiagnosticRelatedInformation namespace provides helper functions to work with
 * [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) literals.
 */
var DiagnosticRelatedInformation;
(function (DiagnosticRelatedInformation) {
    /**
     * Creates a new DiagnosticRelatedInformation literal.
     */
    function create(location, message) {
        return {
            location: location,
            message: message
        };
    }
    DiagnosticRelatedInformation.create = create;
    /**
     * Checks whether the given literal conforms to the [DiagnosticRelatedInformation](#DiagnosticRelatedInformation) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
    }
    DiagnosticRelatedInformation.is = is;
})(DiagnosticRelatedInformation || (DiagnosticRelatedInformation = {}));
/**
 * The diagnostic's severity.
 */
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    /**
     * Reports an error.
     */
    DiagnosticSeverity.Error = 1;
    /**
     * Reports a warning.
     */
    DiagnosticSeverity.Warning = 2;
    /**
     * Reports an information.
     */
    DiagnosticSeverity.Information = 3;
    /**
     * Reports a hint.
     */
    DiagnosticSeverity.Hint = 4;
})(DiagnosticSeverity || (DiagnosticSeverity = {}));
/**
 * The Diagnostic namespace provides helper functions to work with
 * [Diagnostic](#Diagnostic) literals.
 */
var Diagnostic;
(function (Diagnostic) {
    /**
     * Creates a new Diagnostic literal.
     */
    function create(range, message, severity, code, source, relatedInformation) {
        var result = { range: range, message: message };
        if (Is.defined(severity)) {
            result.severity = severity;
        }
        if (Is.defined(code)) {
            result.code = code;
        }
        if (Is.defined(source)) {
            result.source = source;
        }
        if (Is.defined(relatedInformation)) {
            result.relatedInformation = relatedInformation;
        }
        return result;
    }
    Diagnostic.create = create;
    /**
     * Checks whether the given literal conforms to the [Diagnostic](#Diagnostic) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate)
            && Range.is(candidate.range)
            && Is.string(candidate.message)
            && (Is.number(candidate.severity) || Is.undefined(candidate.severity))
            && (Is.number(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code))
            && (Is.string(candidate.source) || Is.undefined(candidate.source))
            && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
    }
    Diagnostic.is = is;
})(Diagnostic || (Diagnostic = {}));
/**
 * The Command namespace provides helper functions to work with
 * [Command](#Command) literals.
 */
var Command;
(function (Command) {
    /**
     * Creates a new Command literal.
     */
    function create(title, command) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var result = { title: title, command: command };
        if (Is.defined(args) && args.length > 0) {
            result.arguments = args;
        }
        return result;
    }
    Command.create = create;
    /**
     * Checks whether the given literal conforms to the [Command](#Command) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.title) && Is.string(candidate.command);
    }
    Command.is = is;
})(Command || (Command = {}));
/**
 * The TextEdit namespace provides helper function to create replace,
 * insert and delete edits more easily.
 */
var TextEdit;
(function (TextEdit) {
    /**
     * Creates a replace text edit.
     * @param range The range of text to be replaced.
     * @param newText The new text.
     */
    function replace(range, newText) {
        return { range: range, newText: newText };
    }
    TextEdit.replace = replace;
    /**
     * Creates a insert text edit.
     * @param position The position to insert the text at.
     * @param newText The text to be inserted.
     */
    function insert(position, newText) {
        return { range: { start: position, end: position }, newText: newText };
    }
    TextEdit.insert = insert;
    /**
     * Creates a delete text edit.
     * @param range The range of text to be deleted.
     */
    function del(range) {
        return { range: range, newText: '' };
    }
    TextEdit.del = del;
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate)
            && Is.string(candidate.newText)
            && Range.is(candidate.range);
    }
    TextEdit.is = is;
})(TextEdit || (TextEdit = {}));
/**
 * The TextDocumentEdit namespace provides helper function to create
 * an edit that manipulates a text document.
 */
var TextDocumentEdit;
(function (TextDocumentEdit) {
    /**
     * Creates a new `TextDocumentEdit`
     */
    function create(textDocument, edits) {
        return { textDocument: textDocument, edits: edits };
    }
    TextDocumentEdit.create = create;
    function is(value) {
        var candidate = value;
        return Is.defined(candidate)
            && VersionedTextDocumentIdentifier.is(candidate.textDocument)
            && Array.isArray(candidate.edits);
    }
    TextDocumentEdit.is = is;
})(TextDocumentEdit || (TextDocumentEdit = {}));
var WorkspaceEdit;
(function (WorkspaceEdit) {
    function is(value) {
        var candidate = value;
        return candidate &&
            (candidate.changes !== void 0 || candidate.documentChanges !== void 0) &&
            (candidate.documentChanges === void 0 || Is.typedArray(candidate.documentChanges, TextDocumentEdit.is));
    }
    WorkspaceEdit.is = is;
})(WorkspaceEdit || (WorkspaceEdit = {}));
var TextEditChangeImpl = /** @class */ (function () {
    function TextEditChangeImpl(edits) {
        this.edits = edits;
    }
    TextEditChangeImpl.prototype.insert = function (position, newText) {
        this.edits.push(TextEdit.insert(position, newText));
    };
    TextEditChangeImpl.prototype.replace = function (range, newText) {
        this.edits.push(TextEdit.replace(range, newText));
    };
    TextEditChangeImpl.prototype.delete = function (range) {
        this.edits.push(TextEdit.del(range));
    };
    TextEditChangeImpl.prototype.add = function (edit) {
        this.edits.push(edit);
    };
    TextEditChangeImpl.prototype.all = function () {
        return this.edits;
    };
    TextEditChangeImpl.prototype.clear = function () {
        this.edits.splice(0, this.edits.length);
    };
    return TextEditChangeImpl;
}());
/**
 * A workspace change helps constructing changes to a workspace.
 */
var WorkspaceChange = /** @class */ (function () {
    function WorkspaceChange(workspaceEdit) {
        var _this = this;
        this._textEditChanges = Object.create(null);
        if (workspaceEdit) {
            this._workspaceEdit = workspaceEdit;
            if (workspaceEdit.documentChanges) {
                workspaceEdit.documentChanges.forEach(function (textDocumentEdit) {
                    var textEditChange = new TextEditChangeImpl(textDocumentEdit.edits);
                    _this._textEditChanges[textDocumentEdit.textDocument.uri] = textEditChange;
                });
            }
            else if (workspaceEdit.changes) {
                Object.keys(workspaceEdit.changes).forEach(function (key) {
                    var textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
                    _this._textEditChanges[key] = textEditChange;
                });
            }
        }
    }
    Object.defineProperty(WorkspaceChange.prototype, "edit", {
        /**
         * Returns the underlying [WorkspaceEdit](#WorkspaceEdit) literal
         * use to be returned from a workspace edit operation like rename.
         */
        get: function () {
            return this._workspaceEdit;
        },
        enumerable: true,
        configurable: true
    });
    WorkspaceChange.prototype.getTextEditChange = function (key) {
        if (VersionedTextDocumentIdentifier.is(key)) {
            if (!this._workspaceEdit) {
                this._workspaceEdit = {
                    documentChanges: []
                };
            }
            if (!this._workspaceEdit.documentChanges) {
                throw new Error('Workspace edit is not configured for versioned document changes.');
            }
            var textDocument = key;
            var result = this._textEditChanges[textDocument.uri];
            if (!result) {
                var edits = [];
                var textDocumentEdit = {
                    textDocument: textDocument,
                    edits: edits
                };
                this._workspaceEdit.documentChanges.push(textDocumentEdit);
                result = new TextEditChangeImpl(edits);
                this._textEditChanges[textDocument.uri] = result;
            }
            return result;
        }
        else {
            if (!this._workspaceEdit) {
                this._workspaceEdit = {
                    changes: Object.create(null)
                };
            }
            if (!this._workspaceEdit.changes) {
                throw new Error('Workspace edit is not configured for normal text edit changes.');
            }
            var result = this._textEditChanges[key];
            if (!result) {
                var edits = [];
                this._workspaceEdit.changes[key] = edits;
                result = new TextEditChangeImpl(edits);
                this._textEditChanges[key] = result;
            }
            return result;
        }
    };
    return WorkspaceChange;
}());

/**
 * The TextDocumentIdentifier namespace provides helper functions to work with
 * [TextDocumentIdentifier](#TextDocumentIdentifier) literals.
 */
var TextDocumentIdentifier;
(function (TextDocumentIdentifier) {
    /**
     * Creates a new TextDocumentIdentifier literal.
     * @param uri The document's uri.
     */
    function create(uri) {
        return { uri: uri };
    }
    TextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [TextDocumentIdentifier](#TextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri);
    }
    TextDocumentIdentifier.is = is;
})(TextDocumentIdentifier || (TextDocumentIdentifier = {}));
/**
 * The VersionedTextDocumentIdentifier namespace provides helper functions to work with
 * [VersionedTextDocumentIdentifier](#VersionedTextDocumentIdentifier) literals.
 */
var VersionedTextDocumentIdentifier;
(function (VersionedTextDocumentIdentifier) {
    /**
     * Creates a new VersionedTextDocumentIdentifier literal.
     * @param uri The document's uri.
     * @param uri The document's text.
     */
    function create(uri, version) {
        return { uri: uri, version: version };
    }
    VersionedTextDocumentIdentifier.create = create;
    /**
     * Checks whether the given literal conforms to the [VersionedTextDocumentIdentifier](#VersionedTextDocumentIdentifier) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && Is.number(candidate.version);
    }
    VersionedTextDocumentIdentifier.is = is;
})(VersionedTextDocumentIdentifier || (VersionedTextDocumentIdentifier = {}));
/**
 * The TextDocumentItem namespace provides helper functions to work with
 * [TextDocumentItem](#TextDocumentItem) literals.
 */
var TextDocumentItem;
(function (TextDocumentItem) {
    /**
     * Creates a new TextDocumentItem literal.
     * @param uri The document's uri.
     * @param languageId The document's language identifier.
     * @param version The document's version number.
     * @param text The document's text.
     */
    function create(uri, languageId, version, text) {
        return { uri: uri, languageId: languageId, version: version, text: text };
    }
    TextDocumentItem.create = create;
    /**
     * Checks whether the given literal conforms to the [TextDocumentItem](#TextDocumentItem) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.number(candidate.version) && Is.string(candidate.text);
    }
    TextDocumentItem.is = is;
})(TextDocumentItem || (TextDocumentItem = {}));
/**
 * Describes the content type that a client supports in various
 * result literals like `Hover`, `ParameterInfo` or `CompletionItem`.
 *
 * Please note that `MarkupKinds` must not start with a `$`. This kinds
 * are reserved for internal usage.
 */
var MarkupKind;
(function (MarkupKind) {
    /**
     * Plain text is supported as a content format
     */
    MarkupKind.PlainText = 'plaintext';
    /**
     * Markdown is supported as a content format
     */
    MarkupKind.Markdown = 'markdown';
})(MarkupKind || (MarkupKind = {}));
(function (MarkupKind) {
    /**
     * Checks whether the given value is a value of the [MarkupKind](#MarkupKind) type.
     */
    function is(value) {
        var candidate = value;
        return candidate === MarkupKind.PlainText || candidate === MarkupKind.Markdown;
    }
    MarkupKind.is = is;
})(MarkupKind || (MarkupKind = {}));
var MarkupContent;
(function (MarkupContent) {
    /**
     * Checks whether the given value conforms to the [MarkupContent](#MarkupContent) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
    }
    MarkupContent.is = is;
})(MarkupContent || (MarkupContent = {}));
/**
 * The kind of a completion entry.
 */
var CompletionItemKind;
(function (CompletionItemKind) {
    CompletionItemKind.Text = 1;
    CompletionItemKind.Method = 2;
    CompletionItemKind.Function = 3;
    CompletionItemKind.Constructor = 4;
    CompletionItemKind.Field = 5;
    CompletionItemKind.Variable = 6;
    CompletionItemKind.Class = 7;
    CompletionItemKind.Interface = 8;
    CompletionItemKind.Module = 9;
    CompletionItemKind.Property = 10;
    CompletionItemKind.Unit = 11;
    CompletionItemKind.Value = 12;
    CompletionItemKind.Enum = 13;
    CompletionItemKind.Keyword = 14;
    CompletionItemKind.Snippet = 15;
    CompletionItemKind.Color = 16;
    CompletionItemKind.File = 17;
    CompletionItemKind.Reference = 18;
    CompletionItemKind.Folder = 19;
    CompletionItemKind.EnumMember = 20;
    CompletionItemKind.Constant = 21;
    CompletionItemKind.Struct = 22;
    CompletionItemKind.Event = 23;
    CompletionItemKind.Operator = 24;
    CompletionItemKind.TypeParameter = 25;
})(CompletionItemKind || (CompletionItemKind = {}));
/**
 * Defines whether the insert text in a completion item should be interpreted as
 * plain text or a snippet.
 */
var InsertTextFormat;
(function (InsertTextFormat) {
    /**
     * The primary text to be inserted is treated as a plain string.
     */
    InsertTextFormat.PlainText = 1;
    /**
     * The primary text to be inserted is treated as a snippet.
     *
     * A snippet can define tab stops and placeholders with `$1`, `$2`
     * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
     * the end of the snippet. Placeholders with equal identifiers are linked,
     * that is typing in one will update others too.
     *
     * See also: https://github.com/Microsoft/vscode/blob/master/src/vs/editor/contrib/snippet/common/snippet.md
     */
    InsertTextFormat.Snippet = 2;
})(InsertTextFormat || (InsertTextFormat = {}));
/**
 * The CompletionItem namespace provides functions to deal with
 * completion items.
 */
var CompletionItem;
(function (CompletionItem) {
    /**
     * Create a completion item and seed it with a label.
     * @param label The completion item's label
     */
    function create(label) {
        return { label: label };
    }
    CompletionItem.create = create;
})(CompletionItem || (CompletionItem = {}));
/**
 * The CompletionList namespace provides functions to deal with
 * completion lists.
 */
var CompletionList;
(function (CompletionList) {
    /**
     * Creates a new completion list.
     *
     * @param items The completion items.
     * @param isIncomplete The list is not complete.
     */
    function create(items, isIncomplete) {
        return { items: items ? items : [], isIncomplete: !!isIncomplete };
    }
    CompletionList.create = create;
})(CompletionList || (CompletionList = {}));
var MarkedString;
(function (MarkedString) {
    /**
     * Creates a marked string from plain text.
     *
     * @param plainText The plain text.
     */
    function fromPlainText(plainText) {
        return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&"); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    }
    MarkedString.fromPlainText = fromPlainText;
    /**
     * Checks whether the given value conforms to the [MarkedString](#MarkedString) type.
     */
    function is(value) {
        var candidate = value;
        return Is.string(candidate) || (Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value));
    }
    MarkedString.is = is;
})(MarkedString || (MarkedString = {}));
var Hover;
(function (Hover) {
    /**
     * Checks whether the given value conforms to the [Hover](#Hover) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.objectLiteral(candidate) && (MarkupContent.is(candidate.contents) ||
            MarkedString.is(candidate.contents) ||
            Is.typedArray(candidate.contents, MarkedString.is)) && (value.range === void 0 || Range.is(value.range));
    }
    Hover.is = is;
})(Hover || (Hover = {}));
/**
 * The ParameterInformation namespace provides helper functions to work with
 * [ParameterInformation](#ParameterInformation) literals.
 */
var ParameterInformation;
(function (ParameterInformation) {
    /**
     * Creates a new parameter information literal.
     *
     * @param label A label string.
     * @param documentation A doc string.
     */
    function create(label, documentation) {
        return documentation ? { label: label, documentation: documentation } : { label: label };
    }
    ParameterInformation.create = create;
    ;
})(ParameterInformation || (ParameterInformation = {}));
/**
 * The SignatureInformation namespace provides helper functions to work with
 * [SignatureInformation](#SignatureInformation) literals.
 */
var SignatureInformation;
(function (SignatureInformation) {
    function create(label, documentation) {
        var parameters = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            parameters[_i - 2] = arguments[_i];
        }
        var result = { label: label };
        if (Is.defined(documentation)) {
            result.documentation = documentation;
        }
        if (Is.defined(parameters)) {
            result.parameters = parameters;
        }
        else {
            result.parameters = [];
        }
        return result;
    }
    SignatureInformation.create = create;
})(SignatureInformation || (SignatureInformation = {}));
/**
 * A document highlight kind.
 */
var DocumentHighlightKind;
(function (DocumentHighlightKind) {
    /**
     * A textual occurrence.
     */
    DocumentHighlightKind.Text = 1;
    /**
     * Read-access of a symbol, like reading a variable.
     */
    DocumentHighlightKind.Read = 2;
    /**
     * Write-access of a symbol, like writing to a variable.
     */
    DocumentHighlightKind.Write = 3;
})(DocumentHighlightKind || (DocumentHighlightKind = {}));
/**
 * DocumentHighlight namespace to provide helper functions to work with
 * [DocumentHighlight](#DocumentHighlight) literals.
 */
var DocumentHighlight;
(function (DocumentHighlight) {
    /**
     * Create a DocumentHighlight object.
     * @param range The range the highlight applies to.
     */
    function create(range, kind) {
        var result = { range: range };
        if (Is.number(kind)) {
            result.kind = kind;
        }
        return result;
    }
    DocumentHighlight.create = create;
})(DocumentHighlight || (DocumentHighlight = {}));
/**
 * A symbol kind.
 */
var SymbolKind;
(function (SymbolKind) {
    SymbolKind.File = 1;
    SymbolKind.Module = 2;
    SymbolKind.Namespace = 3;
    SymbolKind.Package = 4;
    SymbolKind.Class = 5;
    SymbolKind.Method = 6;
    SymbolKind.Property = 7;
    SymbolKind.Field = 8;
    SymbolKind.Constructor = 9;
    SymbolKind.Enum = 10;
    SymbolKind.Interface = 11;
    SymbolKind.Function = 12;
    SymbolKind.Variable = 13;
    SymbolKind.Constant = 14;
    SymbolKind.String = 15;
    SymbolKind.Number = 16;
    SymbolKind.Boolean = 17;
    SymbolKind.Array = 18;
    SymbolKind.Object = 19;
    SymbolKind.Key = 20;
    SymbolKind.Null = 21;
    SymbolKind.EnumMember = 22;
    SymbolKind.Struct = 23;
    SymbolKind.Event = 24;
    SymbolKind.Operator = 25;
    SymbolKind.TypeParameter = 26;
})(SymbolKind || (SymbolKind = {}));
var SymbolInformation;
(function (SymbolInformation) {
    /**
     * Creates a new symbol information literal.
     *
     * @param name The name of the symbol.
     * @param kind The kind of the symbol.
     * @param range The range of the location of the symbol.
     * @param uri The resource of the location of symbol, defaults to the current document.
     * @param containerName The name of the symbol containing the symbol.
     */
    function create(name, kind, range, uri, containerName) {
        var result = {
            name: name,
            kind: kind,
            location: { uri: uri, range: range }
        };
        if (containerName) {
            result.containerName = containerName;
        }
        return result;
    }
    SymbolInformation.create = create;
})(SymbolInformation || (SymbolInformation = {}));
/**
 * Represents programming constructs like variables, classes, interfaces etc.
 * that appear in a document. Document symbols can be hierarchical and they
 * have two ranges: one that encloses its definition and one that points to
 * its most interesting range, e.g. the range of an identifier.
 */
var DocumentSymbol = /** @class */ (function () {
    function DocumentSymbol() {
    }
    return DocumentSymbol;
}());

(function (DocumentSymbol) {
    /**
     * Creates a new symbol information literal.
     *
     * @param name The name of the symbol.
     * @param detail The detail of the symbol.
     * @param kind The kind of the symbol.
     * @param range The range of the symbol.
     * @param selectionRange The selectionRange of the symbol.
     * @param children Children of the symbol.
     */
    function create(name, detail, kind, range, selectionRange, children) {
        var result = {
            name: name,
            detail: detail,
            kind: kind,
            range: range,
            selectionRange: selectionRange
        };
        if (children !== void 0) {
            result.children = children;
        }
        return result;
    }
    DocumentSymbol.create = create;
    /**
     * Checks whether the given literal conforms to the [DocumentSymbol](#DocumentSymbol) interface.
     */
    function is(value) {
        var candidate = value;
        return candidate &&
            Is.string(candidate.name) && Is.number(candidate.kind) &&
            Range.is(candidate.range) && Range.is(candidate.selectionRange) &&
            (candidate.detail === void 0 || Is.string(candidate.detail)) &&
            (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) &&
            (candidate.children === void 0 || Array.isArray(candidate.children));
    }
    DocumentSymbol.is = is;
})(DocumentSymbol || (DocumentSymbol = {}));
/**
 * A set of predefined code action kinds
 */
var CodeActionKind;
(function (CodeActionKind) {
    /**
     * Base kind for quickfix actions: 'quickfix'
     */
    CodeActionKind.QuickFix = 'quickfix';
    /**
     * Base kind for refactoring actions: 'refactor'
     */
    CodeActionKind.Refactor = 'refactor';
    /**
     * Base kind for refactoring extraction actions: 'refactor.extract'
     *
     * Example extract actions:
     *
     * - Extract method
     * - Extract function
     * - Extract variable
     * - Extract interface from class
     * - ...
     */
    CodeActionKind.RefactorExtract = 'refactor.extract';
    /**
     * Base kind for refactoring inline actions: 'refactor.inline'
     *
     * Example inline actions:
     *
     * - Inline function
     * - Inline variable
     * - Inline constant
     * - ...
     */
    CodeActionKind.RefactorInline = 'refactor.inline';
    /**
     * Base kind for refactoring rewrite actions: 'refactor.rewrite'
     *
     * Example rewrite actions:
     *
     * - Convert JavaScript function to class
     * - Add or remove parameter
     * - Encapsulate field
     * - Make method static
     * - Move method to base class
     * - ...
     */
    CodeActionKind.RefactorRewrite = 'refactor.rewrite';
    /**
     * Base kind for source actions: `source`
     *
     * Source code actions apply to the entire file.
     */
    CodeActionKind.Source = 'source';
    /**
     * Base kind for an organize imports source action: `source.organizeImports`
     */
    CodeActionKind.SourceOrganizeImports = 'source.organizeImports';
})(CodeActionKind || (CodeActionKind = {}));
/**
 * The CodeActionContext namespace provides helper functions to work with
 * [CodeActionContext](#CodeActionContext) literals.
 */
var CodeActionContext;
(function (CodeActionContext) {
    /**
     * Creates a new CodeActionContext literal.
     */
    function create(diagnostics, only) {
        var result = { diagnostics: diagnostics };
        if (only !== void 0 && only !== null) {
            result.only = only;
        }
        return result;
    }
    CodeActionContext.create = create;
    /**
     * Checks whether the given literal conforms to the [CodeActionContext](#CodeActionContext) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string));
    }
    CodeActionContext.is = is;
})(CodeActionContext || (CodeActionContext = {}));
var CodeAction;
(function (CodeAction) {
    function create(title, commandOrEdit, kind) {
        var result = { title: title };
        if (Command.is(commandOrEdit)) {
            result.command = commandOrEdit;
        }
        else {
            result.edit = commandOrEdit;
        }
        if (kind !== void null) {
            result.kind = kind;
        }
        return result;
    }
    CodeAction.create = create;
    function is(value) {
        var candidate = value;
        return candidate && Is.string(candidate.title) &&
            (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) &&
            (candidate.kind === void 0 || Is.string(candidate.kind)) &&
            (candidate.edit !== void 0 || candidate.command !== void 0) &&
            (candidate.command === void 0 || Command.is(candidate.command)) &&
            (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit));
    }
    CodeAction.is = is;
})(CodeAction || (CodeAction = {}));
/**
 * The CodeLens namespace provides helper functions to work with
 * [CodeLens](#CodeLens) literals.
 */
var CodeLens;
(function (CodeLens) {
    /**
     * Creates a new CodeLens literal.
     */
    function create(range, data) {
        var result = { range: range };
        if (Is.defined(data))
            result.data = data;
        return result;
    }
    CodeLens.create = create;
    /**
     * Checks whether the given literal conforms to the [CodeLens](#CodeLens) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
    }
    CodeLens.is = is;
})(CodeLens || (CodeLens = {}));
/**
 * The FormattingOptions namespace provides helper functions to work with
 * [FormattingOptions](#FormattingOptions) literals.
 */
var FormattingOptions;
(function (FormattingOptions) {
    /**
     * Creates a new FormattingOptions literal.
     */
    function create(tabSize, insertSpaces) {
        return { tabSize: tabSize, insertSpaces: insertSpaces };
    }
    FormattingOptions.create = create;
    /**
     * Checks whether the given literal conforms to the [FormattingOptions](#FormattingOptions) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.number(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
    }
    FormattingOptions.is = is;
})(FormattingOptions || (FormattingOptions = {}));
/**
 * A document link is a range in a text document that links to an internal or external resource, like another
 * text document or a web site.
 */
var DocumentLink = /** @class */ (function () {
    function DocumentLink() {
    }
    return DocumentLink;
}());

/**
 * The DocumentLink namespace provides helper functions to work with
 * [DocumentLink](#DocumentLink) literals.
 */
(function (DocumentLink) {
    /**
     * Creates a new DocumentLink literal.
     */
    function create(range, target, data) {
        return { range: range, target: target, data: data };
    }
    DocumentLink.create = create;
    /**
     * Checks whether the given literal conforms to the [DocumentLink](#DocumentLink) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Range.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
    }
    DocumentLink.is = is;
})(DocumentLink || (DocumentLink = {}));
var EOL = ['\n', '\r\n', '\r'];
var TextDocument;
(function (TextDocument) {
    /**
     * Creates a new ITextDocument literal from the given uri and content.
     * @param uri The document's uri.
     * @param languageId  The document's language Id.
     * @param content The document's content.
     */
    function create(uri, languageId, version, content) {
        return new FullTextDocument(uri, languageId, version, content);
    }
    TextDocument.create = create;
    /**
     * Checks whether the given literal conforms to the [ITextDocument](#ITextDocument) interface.
     */
    function is(value) {
        var candidate = value;
        return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.number(candidate.lineCount)
            && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
    }
    TextDocument.is = is;
    function applyEdits(document, edits) {
        var text = document.getText();
        var sortedEdits = mergeSort(edits, function (a, b) {
            var diff = a.range.start.line - b.range.start.line;
            if (diff === 0) {
                return a.range.start.character - b.range.start.character;
            }
            return diff;
        });
        var lastModifiedOffset = text.length;
        for (var i = sortedEdits.length - 1; i >= 0; i--) {
            var e = sortedEdits[i];
            var startOffset = document.offsetAt(e.range.start);
            var endOffset = document.offsetAt(e.range.end);
            if (endOffset <= lastModifiedOffset) {
                text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
            }
            else {
                throw new Error('Ovelapping edit');
            }
            lastModifiedOffset = startOffset;
        }
        return text;
    }
    TextDocument.applyEdits = applyEdits;
    function mergeSort(data, compare) {
        if (data.length <= 1) {
            // sorted
            return data;
        }
        var p = (data.length / 2) | 0;
        var left = data.slice(0, p);
        var right = data.slice(p);
        mergeSort(left, compare);
        mergeSort(right, compare);
        var leftIdx = 0;
        var rightIdx = 0;
        var i = 0;
        while (leftIdx < left.length && rightIdx < right.length) {
            var ret = compare(left[leftIdx], right[rightIdx]);
            if (ret <= 0) {
                // smaller_equal -> take left to preserve order
                data[i++] = left[leftIdx++];
            }
            else {
                // greater -> take right
                data[i++] = right[rightIdx++];
            }
        }
        while (leftIdx < left.length) {
            data[i++] = left[leftIdx++];
        }
        while (rightIdx < right.length) {
            data[i++] = right[rightIdx++];
        }
        return data;
    }
})(TextDocument || (TextDocument = {}));
/**
 * Represents reasons why a text document is saved.
 */
var TextDocumentSaveReason;
(function (TextDocumentSaveReason) {
    /**
     * Manually triggered, e.g. by the user pressing save, by starting debugging,
     * or by an API call.
     */
    TextDocumentSaveReason.Manual = 1;
    /**
     * Automatic after a delay.
     */
    TextDocumentSaveReason.AfterDelay = 2;
    /**
     * When the editor lost focus.
     */
    TextDocumentSaveReason.FocusOut = 3;
})(TextDocumentSaveReason || (TextDocumentSaveReason = {}));
var FullTextDocument = /** @class */ (function () {
    function FullTextDocument(uri, languageId, version, content) {
        this._uri = uri;
        this._languageId = languageId;
        this._version = version;
        this._content = content;
        this._lineOffsets = null;
    }
    Object.defineProperty(FullTextDocument.prototype, "uri", {
        get: function () {
            return this._uri;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "languageId", {
        get: function () {
            return this._languageId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullTextDocument.prototype, "version", {
        get: function () {
            return this._version;
        },
        enumerable: true,
        configurable: true
    });
    FullTextDocument.prototype.getText = function (range) {
        if (range) {
            var start = this.offsetAt(range.start);
            var end = this.offsetAt(range.end);
            return this._content.substring(start, end);
        }
        return this._content;
    };
    FullTextDocument.prototype.update = function (event, version) {
        this._content = event.text;
        this._version = version;
        this._lineOffsets = null;
    };
    FullTextDocument.prototype.getLineOffsets = function () {
        if (this._lineOffsets === null) {
            var lineOffsets = [];
            var text = this._content;
            var isLineStart = true;
            for (var i = 0; i < text.length; i++) {
                if (isLineStart) {
                    lineOffsets.push(i);
                    isLineStart = false;
                }
                var ch = text.charAt(i);
                isLineStart = (ch === '\r' || ch === '\n');
                if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
                    i++;
                }
            }
            if (isLineStart && text.length > 0) {
                lineOffsets.push(text.length);
            }
            this._lineOffsets = lineOffsets;
        }
        return this._lineOffsets;
    };
    FullTextDocument.prototype.positionAt = function (offset) {
        offset = Math.max(Math.min(offset, this._content.length), 0);
        var lineOffsets = this.getLineOffsets();
        var low = 0, high = lineOffsets.length;
        if (high === 0) {
            return Position.create(0, offset);
        }
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (lineOffsets[mid] > offset) {
                high = mid;
            }
            else {
                low = mid + 1;
            }
        }
        // low is the least x for which the line offset is larger than the current offset
        // or array.length if no line offset is larger than the current offset
        var line = low - 1;
        return Position.create(line, offset - lineOffsets[line]);
    };
    FullTextDocument.prototype.offsetAt = function (position) {
        var lineOffsets = this.getLineOffsets();
        if (position.line >= lineOffsets.length) {
            return this._content.length;
        }
        else if (position.line < 0) {
            return 0;
        }
        var lineOffset = lineOffsets[position.line];
        var nextLineOffset = (position.line + 1 < lineOffsets.length) ? lineOffsets[position.line + 1] : this._content.length;
        return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
    };
    Object.defineProperty(FullTextDocument.prototype, "lineCount", {
        get: function () {
            return this.getLineOffsets().length;
        },
        enumerable: true,
        configurable: true
    });
    return FullTextDocument;
}());
var Is;
(function (Is) {
    var toString = Object.prototype.toString;
    function defined(value) {
        return typeof value !== 'undefined';
    }
    Is.defined = defined;
    function undefined(value) {
        return typeof value === 'undefined';
    }
    Is.undefined = undefined;
    function boolean(value) {
        return value === true || value === false;
    }
    Is.boolean = boolean;
    function string(value) {
        return toString.call(value) === '[object String]';
    }
    Is.string = string;
    function number(value) {
        return toString.call(value) === '[object Number]';
    }
    Is.number = number;
    function func(value) {
        return toString.call(value) === '[object Function]';
    }
    Is.func = func;
    function objectLiteral(value) {
        // Strictly speaking class instances pass this check as well. Since the LSP
        // doesn't use classes we ignore this for now. If we do we need to add something
        // like this: `Object.getPrototypeOf(Object.getPrototypeOf(x)) === null`
        return value !== null && typeof value === 'object';
    }
    Is.objectLiteral = objectLiteral;
    function typedArray(value, check) {
        return Array.isArray(value) && value.every(check);
    }
    Is.typedArray = typedArray;
})(Is || (Is = {}));


/***/ }),

/***/ "./node_modules/fuzzaldrin-plus/lib/filter.js":
/*!****************************************************!*\
  !*** ./node_modules/fuzzaldrin-plus/lib/filter.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(function() {
  var Query, pathScorer, pluckCandidates, scorer, sortCandidates;

  scorer = __webpack_require__(/*! ./scorer */ "./node_modules/fuzzaldrin-plus/lib/scorer.js");

  pathScorer = __webpack_require__(/*! ./pathScorer */ "./node_modules/fuzzaldrin-plus/lib/pathScorer.js");

  Query = __webpack_require__(/*! ./query */ "./node_modules/fuzzaldrin-plus/lib/query.js");

  pluckCandidates = function(a) {
    return a.candidate;
  };

  sortCandidates = function(a, b) {
    return b.score - a.score;
  };

  module.exports = function(candidates, query, options) {
    var bKey, candidate, key, maxInners, maxResults, score, scoreProvider, scoredCandidates, spotLeft, string, usePathScoring, _i, _len;
    scoredCandidates = [];
    key = options.key, maxResults = options.maxResults, maxInners = options.maxInners, usePathScoring = options.usePathScoring;
    spotLeft = (maxInners != null) && maxInners > 0 ? maxInners : candidates.length + 1;
    bKey = key != null;
    scoreProvider = usePathScoring ? pathScorer : scorer;
    for (_i = 0, _len = candidates.length; _i < _len; _i++) {
      candidate = candidates[_i];
      string = bKey ? candidate[key] : candidate;
      if (!string) {
        continue;
      }
      score = scoreProvider.score(string, query, options);
      if (score > 0) {
        scoredCandidates.push({
          candidate: candidate,
          score: score
        });
        if (!--spotLeft) {
          break;
        }
      }
    }
    scoredCandidates.sort(sortCandidates);
    candidates = scoredCandidates.map(pluckCandidates);
    if (maxResults != null) {
      candidates = candidates.slice(0, maxResults);
    }
    return candidates;
  };

}).call(this);


/***/ }),

/***/ "./node_modules/fuzzaldrin-plus/lib/fuzzaldrin.js":
/*!********************************************************!*\
  !*** ./node_modules/fuzzaldrin-plus/lib/fuzzaldrin.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(function() {
  var Query, defaultPathSeparator, filter, matcher, parseOptions, pathScorer, preparedQueryCache, scorer;

  filter = __webpack_require__(/*! ./filter */ "./node_modules/fuzzaldrin-plus/lib/filter.js");

  matcher = __webpack_require__(/*! ./matcher */ "./node_modules/fuzzaldrin-plus/lib/matcher.js");

  scorer = __webpack_require__(/*! ./scorer */ "./node_modules/fuzzaldrin-plus/lib/scorer.js");

  pathScorer = __webpack_require__(/*! ./pathScorer */ "./node_modules/fuzzaldrin-plus/lib/pathScorer.js");

  Query = __webpack_require__(/*! ./query */ "./node_modules/fuzzaldrin-plus/lib/query.js");

  preparedQueryCache = null;

  defaultPathSeparator = (typeof process !== "undefined" && process !== null ? process.platform : void 0) === "win32" ? '\\' : '/';

  module.exports = {
    filter: function(candidates, query, options) {
      if (options == null) {
        options = {};
      }
      if (!((query != null ? query.length : void 0) && (candidates != null ? candidates.length : void 0))) {
        return [];
      }
      options = parseOptions(options, query);
      return filter(candidates, query, options);
    },
    score: function(string, query, options) {
      if (options == null) {
        options = {};
      }
      if (!((string != null ? string.length : void 0) && (query != null ? query.length : void 0))) {
        return 0;
      }
      options = parseOptions(options, query);
      if (options.usePathScoring) {
        return pathScorer.score(string, query, options);
      } else {
        return scorer.score(string, query, options);
      }
    },
    match: function(string, query, options) {
      var _i, _ref, _results;
      if (options == null) {
        options = {};
      }
      if (!string) {
        return [];
      }
      if (!query) {
        return [];
      }
      if (string === query) {
        return (function() {
          _results = [];
          for (var _i = 0, _ref = string.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      }
      options = parseOptions(options, query);
      return matcher.match(string, query, options);
    },
    wrap: function(string, query, options) {
      if (options == null) {
        options = {};
      }
      if (!string) {
        return [];
      }
      if (!query) {
        return [];
      }
      options = parseOptions(options, query);
      return matcher.wrap(string, query, options);
    },
    prepareQuery: function(query, options) {
      if (options == null) {
        options = {};
      }
      options = parseOptions(options, query);
      return options.preparedQuery;
    }
  };

  parseOptions = function(options, query) {
    if (options.allowErrors == null) {
      options.allowErrors = false;
    }
    if (options.usePathScoring == null) {
      options.usePathScoring = true;
    }
    if (options.useExtensionBonus == null) {
      options.useExtensionBonus = false;
    }
    if (options.pathSeparator == null) {
      options.pathSeparator = defaultPathSeparator;
    }
    if (options.optCharRegEx == null) {
      options.optCharRegEx = null;
    }
    if (options.wrap == null) {
      options.wrap = null;
    }
    if (options.preparedQuery == null) {
      options.preparedQuery = preparedQueryCache && preparedQueryCache.query === query ? preparedQueryCache : (preparedQueryCache = new Query(query, options));
    }
    return options;
  };

}).call(this);


/***/ }),

/***/ "./node_modules/fuzzaldrin-plus/lib/matcher.js":
/*!*****************************************************!*\
  !*** ./node_modules/fuzzaldrin-plus/lib/matcher.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(function() {
  var basenameMatch, computeMatch, isMatch, isWordStart, match, mergeMatches, scoreAcronyms, scoreCharacter, scoreConsecutives, _ref;

  _ref = __webpack_require__(/*! ./scorer */ "./node_modules/fuzzaldrin-plus/lib/scorer.js"), isMatch = _ref.isMatch, isWordStart = _ref.isWordStart, scoreConsecutives = _ref.scoreConsecutives, scoreCharacter = _ref.scoreCharacter, scoreAcronyms = _ref.scoreAcronyms;

  exports.match = match = function(string, query, options) {
    var allowErrors, baseMatches, matches, pathSeparator, preparedQuery, string_lw;
    allowErrors = options.allowErrors, preparedQuery = options.preparedQuery, pathSeparator = options.pathSeparator;
    if (!(allowErrors || isMatch(string, preparedQuery.core_lw, preparedQuery.core_up))) {
      return [];
    }
    string_lw = string.toLowerCase();
    matches = computeMatch(string, string_lw, preparedQuery);
    if (matches.length === 0) {
      return matches;
    }
    if (string.indexOf(pathSeparator) > -1) {
      baseMatches = basenameMatch(string, string_lw, preparedQuery, pathSeparator);
      matches = mergeMatches(matches, baseMatches);
    }
    return matches;
  };

  exports.wrap = function(string, query, options) {
    var matchIndex, matchPos, matchPositions, output, strPos, tagClass, tagClose, tagOpen, _ref1;
    if ((options.wrap != null)) {
      _ref1 = options.wrap, tagClass = _ref1.tagClass, tagOpen = _ref1.tagOpen, tagClose = _ref1.tagClose;
    }
    if (tagClass == null) {
      tagClass = 'highlight';
    }
    if (tagOpen == null) {
      tagOpen = '<strong class="' + tagClass + '">';
    }
    if (tagClose == null) {
      tagClose = '</strong>';
    }
    if (string === query) {
      return tagOpen + string + tagClose;
    }
    matchPositions = match(string, query, options);
    if (matchPositions.length === 0) {
      return string;
    }
    output = '';
    matchIndex = -1;
    strPos = 0;
    while (++matchIndex < matchPositions.length) {
      matchPos = matchPositions[matchIndex];
      if (matchPos > strPos) {
        output += string.substring(strPos, matchPos);
        strPos = matchPos;
      }
      while (++matchIndex < matchPositions.length) {
        if (matchPositions[matchIndex] === matchPos + 1) {
          matchPos++;
        } else {
          matchIndex--;
          break;
        }
      }
      matchPos++;
      if (matchPos > strPos) {
        output += tagOpen;
        output += string.substring(strPos, matchPos);
        output += tagClose;
        strPos = matchPos;
      }
    }
    if (strPos <= string.length - 1) {
      output += string.substring(strPos);
    }
    return output;
  };

  basenameMatch = function(subject, subject_lw, preparedQuery, pathSeparator) {
    var basePos, depth, end;
    end = subject.length - 1;
    while (subject[end] === pathSeparator) {
      end--;
    }
    basePos = subject.lastIndexOf(pathSeparator, end);
    if (basePos === -1) {
      return [];
    }
    depth = preparedQuery.depth;
    while (depth-- > 0) {
      basePos = subject.lastIndexOf(pathSeparator, basePos - 1);
      if (basePos === -1) {
        return [];
      }
    }
    basePos++;
    end++;
    return computeMatch(subject.slice(basePos, end), subject_lw.slice(basePos, end), preparedQuery, basePos);
  };

  mergeMatches = function(a, b) {
    var ai, bj, i, j, m, n, out;
    m = a.length;
    n = b.length;
    if (n === 0) {
      return a.slice();
    }
    if (m === 0) {
      return b.slice();
    }
    i = -1;
    j = 0;
    bj = b[j];
    out = [];
    while (++i < m) {
      ai = a[i];
      while (bj <= ai && ++j < n) {
        if (bj < ai) {
          out.push(bj);
        }
        bj = b[j];
      }
      out.push(ai);
    }
    while (j < n) {
      out.push(b[j++]);
    }
    return out;
  };

  computeMatch = function(subject, subject_lw, preparedQuery, offset) {
    var DIAGONAL, LEFT, STOP, UP, acro_score, align, backtrack, csc_diag, csc_row, csc_score, i, j, m, matches, move, n, pos, query, query_lw, score, score_diag, score_row, score_up, si_lw, start, trace;
    if (offset == null) {
      offset = 0;
    }
    query = preparedQuery.query;
    query_lw = preparedQuery.query_lw;
    m = subject.length;
    n = query.length;
    acro_score = scoreAcronyms(subject, subject_lw, query, query_lw).score;
    score_row = new Array(n);
    csc_row = new Array(n);
    STOP = 0;
    UP = 1;
    LEFT = 2;
    DIAGONAL = 3;
    trace = new Array(m * n);
    pos = -1;
    j = -1;
    while (++j < n) {
      score_row[j] = 0;
      csc_row[j] = 0;
    }
    i = -1;
    while (++i < m) {
      score = 0;
      score_up = 0;
      csc_diag = 0;
      si_lw = subject_lw[i];
      j = -1;
      while (++j < n) {
        csc_score = 0;
        align = 0;
        score_diag = score_up;
        if (query_lw[j] === si_lw) {
          start = isWordStart(i, subject, subject_lw);
          csc_score = csc_diag > 0 ? csc_diag : scoreConsecutives(subject, subject_lw, query, query_lw, i, j, start);
          align = score_diag + scoreCharacter(i, j, start, acro_score, csc_score);
        }
        score_up = score_row[j];
        csc_diag = csc_row[j];
        if (score > score_up) {
          move = LEFT;
        } else {
          score = score_up;
          move = UP;
        }
        if (align > score) {
          score = align;
          move = DIAGONAL;
        } else {
          csc_score = 0;
        }
        score_row[j] = score;
        csc_row[j] = csc_score;
        trace[++pos] = score > 0 ? move : STOP;
      }
    }
    i = m - 1;
    j = n - 1;
    pos = i * n + j;
    backtrack = true;
    matches = [];
    while (backtrack && i >= 0 && j >= 0) {
      switch (trace[pos]) {
        case UP:
          i--;
          pos -= n;
          break;
        case LEFT:
          j--;
          pos--;
          break;
        case DIAGONAL:
          matches.push(i + offset);
          j--;
          i--;
          pos -= n + 1;
          break;
        default:
          backtrack = false;
      }
    }
    matches.reverse();
    return matches;
  };

}).call(this);


/***/ }),

/***/ "./node_modules/fuzzaldrin-plus/lib/pathScorer.js":
/*!********************************************************!*\
  !*** ./node_modules/fuzzaldrin-plus/lib/pathScorer.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(function() {
  var computeScore, countDir, file_coeff, getExtension, getExtensionScore, isMatch, scorePath, scoreSize, tau_depth, _ref;

  _ref = __webpack_require__(/*! ./scorer */ "./node_modules/fuzzaldrin-plus/lib/scorer.js"), isMatch = _ref.isMatch, computeScore = _ref.computeScore, scoreSize = _ref.scoreSize;

  tau_depth = 20;

  file_coeff = 2.5;

  exports.score = function(string, query, options) {
    var allowErrors, preparedQuery, score, string_lw;
    preparedQuery = options.preparedQuery, allowErrors = options.allowErrors;
    if (!(allowErrors || isMatch(string, preparedQuery.core_lw, preparedQuery.core_up))) {
      return 0;
    }
    string_lw = string.toLowerCase();
    score = computeScore(string, string_lw, preparedQuery);
    score = scorePath(string, string_lw, score, options);
    return Math.ceil(score);
  };

  scorePath = function(subject, subject_lw, fullPathScore, options) {
    var alpha, basePathScore, basePos, depth, end, extAdjust, fileLength, pathSeparator, preparedQuery, useExtensionBonus;
    if (fullPathScore === 0) {
      return 0;
    }
    preparedQuery = options.preparedQuery, useExtensionBonus = options.useExtensionBonus, pathSeparator = options.pathSeparator;
    end = subject.length - 1;
    while (subject[end] === pathSeparator) {
      end--;
    }
    basePos = subject.lastIndexOf(pathSeparator, end);
    fileLength = end - basePos;
    extAdjust = 1.0;
    if (useExtensionBonus) {
      extAdjust += getExtensionScore(subject_lw, preparedQuery.ext, basePos, end, 2);
      fullPathScore *= extAdjust;
    }
    if (basePos === -1) {
      return fullPathScore;
    }
    depth = preparedQuery.depth;
    while (basePos > -1 && depth-- > 0) {
      basePos = subject.lastIndexOf(pathSeparator, basePos - 1);
    }
    basePathScore = basePos === -1 ? fullPathScore : extAdjust * computeScore(subject.slice(basePos + 1, end + 1), subject_lw.slice(basePos + 1, end + 1), preparedQuery);
    alpha = 0.5 * tau_depth / (tau_depth + countDir(subject, end + 1, pathSeparator));
    return alpha * basePathScore + (1 - alpha) * fullPathScore * scoreSize(0, file_coeff * fileLength);
  };

  exports.countDir = countDir = function(path, end, pathSeparator) {
    var count, i;
    if (end < 1) {
      return 0;
    }
    count = 0;
    i = -1;
    while (++i < end && path[i] === pathSeparator) {
      continue;
    }
    while (++i < end) {
      if (path[i] === pathSeparator) {
        count++;
        while (++i < end && path[i] === pathSeparator) {
          continue;
        }
      }
    }
    return count;
  };

  exports.getExtension = getExtension = function(str) {
    var pos;
    pos = str.lastIndexOf(".");
    if (pos < 0) {
      return "";
    } else {
      return str.substr(pos + 1);
    }
  };

  getExtensionScore = function(candidate, ext, startPos, endPos, maxDepth) {
    var m, matched, n, pos;
    if (!ext.length) {
      return 0;
    }
    pos = candidate.lastIndexOf(".", endPos);
    if (!(pos > startPos)) {
      return 0;
    }
    n = ext.length;
    m = endPos - pos;
    if (m < n) {
      n = m;
      m = ext.length;
    }
    pos++;
    matched = -1;
    while (++matched < n) {
      if (candidate[pos + matched] !== ext[matched]) {
        break;
      }
    }
    if (matched === 0 && maxDepth > 0) {
      return 0.9 * getExtensionScore(candidate, ext, startPos, pos - 2, maxDepth - 1);
    }
    return matched / m;
  };

}).call(this);


/***/ }),

/***/ "./node_modules/fuzzaldrin-plus/lib/query.js":
/*!***************************************************!*\
  !*** ./node_modules/fuzzaldrin-plus/lib/query.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

(function() {
  var Query, coreChars, countDir, getCharCodes, getExtension, opt_char_re, truncatedUpperCase, _ref;

  _ref = __webpack_require__(/*! ./pathScorer */ "./node_modules/fuzzaldrin-plus/lib/pathScorer.js"), countDir = _ref.countDir, getExtension = _ref.getExtension;

  module.exports = Query = (function() {
    function Query(query, _arg) {
      var optCharRegEx, pathSeparator, _ref1;
      _ref1 = _arg != null ? _arg : {}, optCharRegEx = _ref1.optCharRegEx, pathSeparator = _ref1.pathSeparator;
      if (!(query && query.length)) {
        return null;
      }
      this.query = query;
      this.query_lw = query.toLowerCase();
      this.core = coreChars(query, optCharRegEx);
      this.core_lw = this.core.toLowerCase();
      this.core_up = truncatedUpperCase(this.core);
      this.depth = countDir(query, query.length, pathSeparator);
      this.ext = getExtension(this.query_lw);
      this.charCodes = getCharCodes(this.query_lw);
    }

    return Query;

  })();

  opt_char_re = /[ _\-:\/\\]/g;

  coreChars = function(query, optCharRegEx) {
    if (optCharRegEx == null) {
      optCharRegEx = opt_char_re;
    }
    return query.replace(optCharRegEx, '');
  };

  truncatedUpperCase = function(str) {
    var char, upper, _i, _len;
    upper = "";
    for (_i = 0, _len = str.length; _i < _len; _i++) {
      char = str[_i];
      upper += char.toUpperCase()[0];
    }
    return upper;
  };

  getCharCodes = function(str) {
    var charCodes, i, len;
    len = str.length;
    i = -1;
    charCodes = [];
    while (++i < len) {
      charCodes[str.charCodeAt(i)] = true;
    }
    return charCodes;
  };

}).call(this);


/***/ }),

/***/ "./node_modules/fuzzaldrin-plus/lib/scorer.js":
/*!****************************************************!*\
  !*** ./node_modules/fuzzaldrin-plus/lib/scorer.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() {
  var AcronymResult, computeScore, emptyAcronymResult, isAcronymFullWord, isMatch, isSeparator, isWordEnd, isWordStart, miss_coeff, pos_bonus, scoreAcronyms, scoreCharacter, scoreConsecutives, scoreExact, scoreExactMatch, scorePattern, scorePosition, scoreSize, tau_size, wm;

  wm = 150;

  pos_bonus = 20;

  tau_size = 150;

  miss_coeff = 0.75;

  exports.score = function(string, query, options) {
    var allowErrors, preparedQuery, score, string_lw;
    preparedQuery = options.preparedQuery, allowErrors = options.allowErrors;
    if (!(allowErrors || isMatch(string, preparedQuery.core_lw, preparedQuery.core_up))) {
      return 0;
    }
    string_lw = string.toLowerCase();
    score = computeScore(string, string_lw, preparedQuery);
    return Math.ceil(score);
  };

  exports.isMatch = isMatch = function(subject, query_lw, query_up) {
    var i, j, m, n, qj_lw, qj_up, si;
    m = subject.length;
    n = query_lw.length;
    if (!m || n > m) {
      return false;
    }
    i = -1;
    j = -1;
    while (++j < n) {
      qj_lw = query_lw.charCodeAt(j);
      qj_up = query_up.charCodeAt(j);
      while (++i < m) {
        si = subject.charCodeAt(i);
        if (si === qj_lw || si === qj_up) {
          break;
        }
      }
      if (i === m) {
        return false;
      }
    }
    return true;
  };

  exports.computeScore = computeScore = function(subject, subject_lw, preparedQuery) {
    var acro, acro_score, align, csc_diag, csc_row, csc_score, csc_should_rebuild, i, j, m, miss_budget, miss_left, n, pos, query, query_lw, record_miss, score, score_diag, score_row, score_up, si_lw, start, sz;
    query = preparedQuery.query;
    query_lw = preparedQuery.query_lw;
    m = subject.length;
    n = query.length;
    acro = scoreAcronyms(subject, subject_lw, query, query_lw);
    acro_score = acro.score;
    if (acro.count === n) {
      return scoreExact(n, m, acro_score, acro.pos);
    }
    pos = subject_lw.indexOf(query_lw);
    if (pos > -1) {
      return scoreExactMatch(subject, subject_lw, query, query_lw, pos, n, m);
    }
    score_row = new Array(n);
    csc_row = new Array(n);
    sz = scoreSize(n, m);
    miss_budget = Math.ceil(miss_coeff * n) + 5;
    miss_left = miss_budget;
    csc_should_rebuild = true;
    j = -1;
    while (++j < n) {
      score_row[j] = 0;
      csc_row[j] = 0;
    }
    i = -1;
    while (++i < m) {
      si_lw = subject_lw[i];
      if (!si_lw.charCodeAt(0) in preparedQuery.charCodes) {
        if (csc_should_rebuild) {
          j = -1;
          while (++j < n) {
            csc_row[j] = 0;
          }
          csc_should_rebuild = false;
        }
        continue;
      }
      score = 0;
      score_diag = 0;
      csc_diag = 0;
      record_miss = true;
      csc_should_rebuild = true;
      j = -1;
      while (++j < n) {
        score_up = score_row[j];
        if (score_up > score) {
          score = score_up;
        }
        csc_score = 0;
        if (query_lw[j] === si_lw) {
          start = isWordStart(i, subject, subject_lw);
          csc_score = csc_diag > 0 ? csc_diag : scoreConsecutives(subject, subject_lw, query, query_lw, i, j, start);
          align = score_diag + scoreCharacter(i, j, start, acro_score, csc_score);
          if (align > score) {
            score = align;
            miss_left = miss_budget;
          } else {
            if (record_miss && --miss_left <= 0) {
              return Math.max(score, score_row[n - 1]) * sz;
            }
            record_miss = false;
          }
        }
        score_diag = score_up;
        csc_diag = csc_row[j];
        csc_row[j] = csc_score;
        score_row[j] = score;
      }
    }
    score = score_row[n - 1];
    return score * sz;
  };

  exports.isWordStart = isWordStart = function(pos, subject, subject_lw) {
    var curr_s, prev_s;
    if (pos === 0) {
      return true;
    }
    curr_s = subject[pos];
    prev_s = subject[pos - 1];
    return isSeparator(prev_s) || (curr_s !== subject_lw[pos] && prev_s === subject_lw[pos - 1]);
  };

  exports.isWordEnd = isWordEnd = function(pos, subject, subject_lw, len) {
    var curr_s, next_s;
    if (pos === len - 1) {
      return true;
    }
    curr_s = subject[pos];
    next_s = subject[pos + 1];
    return isSeparator(next_s) || (curr_s === subject_lw[pos] && next_s !== subject_lw[pos + 1]);
  };

  isSeparator = function(c) {
    return c === ' ' || c === '.' || c === '-' || c === '_' || c === '/' || c === '\\';
  };

  scorePosition = function(pos) {
    var sc;
    if (pos < pos_bonus) {
      sc = pos_bonus - pos;
      return 100 + sc * sc;
    } else {
      return Math.max(100 + pos_bonus - pos, 0);
    }
  };

  exports.scoreSize = scoreSize = function(n, m) {
    return tau_size / (tau_size + Math.abs(m - n));
  };

  scoreExact = function(n, m, quality, pos) {
    return 2 * n * (wm * quality + scorePosition(pos)) * scoreSize(n, m);
  };

  exports.scorePattern = scorePattern = function(count, len, sameCase, start, end) {
    var bonus, sz;
    sz = count;
    bonus = 6;
    if (sameCase === count) {
      bonus += 2;
    }
    if (start) {
      bonus += 3;
    }
    if (end) {
      bonus += 1;
    }
    if (count === len) {
      if (start) {
        if (sameCase === len) {
          sz += 2;
        } else {
          sz += 1;
        }
      }
      if (end) {
        bonus += 1;
      }
    }
    return sameCase + sz * (sz + bonus);
  };

  exports.scoreCharacter = scoreCharacter = function(i, j, start, acro_score, csc_score) {
    var posBonus;
    posBonus = scorePosition(i);
    if (start) {
      return posBonus + wm * ((acro_score > csc_score ? acro_score : csc_score) + 10);
    }
    return posBonus + wm * csc_score;
  };

  exports.scoreConsecutives = scoreConsecutives = function(subject, subject_lw, query, query_lw, i, j, startOfWord) {
    var k, m, mi, n, nj, sameCase, sz;
    m = subject.length;
    n = query.length;
    mi = m - i;
    nj = n - j;
    k = mi < nj ? mi : nj;
    sameCase = 0;
    sz = 0;
    if (query[j] === subject[i]) {
      sameCase++;
    }
    while (++sz < k && query_lw[++j] === subject_lw[++i]) {
      if (query[j] === subject[i]) {
        sameCase++;
      }
    }
    if (sz < k) {
      i--;
    }
    if (sz === 1) {
      return 1 + 2 * sameCase;
    }
    return scorePattern(sz, n, sameCase, startOfWord, isWordEnd(i, subject, subject_lw, m));
  };

  exports.scoreExactMatch = scoreExactMatch = function(subject, subject_lw, query, query_lw, pos, n, m) {
    var end, i, pos2, sameCase, start;
    start = isWordStart(pos, subject, subject_lw);
    if (!start) {
      pos2 = subject_lw.indexOf(query_lw, pos + 1);
      if (pos2 > -1) {
        start = isWordStart(pos2, subject, subject_lw);
        if (start) {
          pos = pos2;
        }
      }
    }
    i = -1;
    sameCase = 0;
    while (++i < n) {
      if (query[pos + i] === subject[i]) {
        sameCase++;
      }
    }
    end = isWordEnd(pos + n - 1, subject, subject_lw, m);
    return scoreExact(n, m, scorePattern(n, n, sameCase, start, end), pos);
  };

  AcronymResult = (function() {
    function AcronymResult(score, pos, count) {
      this.score = score;
      this.pos = pos;
      this.count = count;
    }

    return AcronymResult;

  })();

  emptyAcronymResult = new AcronymResult(0, 0.1, 0);

  exports.scoreAcronyms = scoreAcronyms = function(subject, subject_lw, query, query_lw) {
    var count, fullWord, i, j, m, n, qj_lw, sameCase, score, sepCount, sumPos;
    m = subject.length;
    n = query.length;
    if (!(m > 1 && n > 1)) {
      return emptyAcronymResult;
    }
    count = 0;
    sepCount = 0;
    sumPos = 0;
    sameCase = 0;
    i = -1;
    j = -1;
    while (++j < n) {
      qj_lw = query_lw[j];
      if (isSeparator(qj_lw)) {
        i = subject_lw.indexOf(qj_lw, i + 1);
        if (i > -1) {
          sepCount++;
          continue;
        } else {
          break;
        }
      }
      while (++i < m) {
        if (qj_lw === subject_lw[i] && isWordStart(i, subject, subject_lw)) {
          if (query[j] === subject[i]) {
            sameCase++;
          }
          sumPos += i;
          count++;
          break;
        }
      }
      if (i === m) {
        break;
      }
    }
    if (count < 2) {
      return emptyAcronymResult;
    }
    fullWord = count === n ? isAcronymFullWord(subject, subject_lw, query, count) : false;
    score = scorePattern(count, n, sameCase, true, fullWord);
    return new AcronymResult(score, sumPos / count, count + sepCount);
  };

  isAcronymFullWord = function(subject, subject_lw, query, nbAcronymInQuery) {
    var count, i, m, n;
    m = subject.length;
    n = query.length;
    count = 0;
    if (m > 12 * n) {
      return false;
    }
    i = -1;
    while (++i < m) {
      if (isWordStart(i, subject, subject_lw) && ++count > nbAcronymInQuery) {
        return false;
      }
    }
    return true;
  };

}).call(this);


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/cancellation.js":
/*!*********************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/cancellation.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __webpack_require__(/*! ./events */ "./node_modules/vscode-jsonrpc/lib/events.js");
const Is = __webpack_require__(/*! ./is */ "./node_modules/vscode-jsonrpc/lib/is.js");
var CancellationToken;
(function (CancellationToken) {
    CancellationToken.None = Object.freeze({
        isCancellationRequested: false,
        onCancellationRequested: events_1.Event.None
    });
    CancellationToken.Cancelled = Object.freeze({
        isCancellationRequested: true,
        onCancellationRequested: events_1.Event.None
    });
    function is(value) {
        let candidate = value;
        return candidate && (candidate === CancellationToken.None
            || candidate === CancellationToken.Cancelled
            || (Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested));
    }
    CancellationToken.is = is;
})(CancellationToken = exports.CancellationToken || (exports.CancellationToken = {}));
const shortcutEvent = Object.freeze(function (callback, context) {
    let handle = setTimeout(callback.bind(context), 0);
    return { dispose() { clearTimeout(handle); } };
});
class MutableToken {
    constructor() {
        this._isCancelled = false;
    }
    cancel() {
        if (!this._isCancelled) {
            this._isCancelled = true;
            if (this._emitter) {
                this._emitter.fire(undefined);
                this._emitter = undefined;
            }
        }
    }
    get isCancellationRequested() {
        return this._isCancelled;
    }
    get onCancellationRequested() {
        if (this._isCancelled) {
            return shortcutEvent;
        }
        if (!this._emitter) {
            this._emitter = new events_1.Emitter();
        }
        return this._emitter.event;
    }
}
class CancellationTokenSource {
    get token() {
        if (!this._token) {
            // be lazy and create the token only when
            // actually needed
            this._token = new MutableToken();
        }
        return this._token;
    }
    cancel() {
        if (!this._token) {
            // save an object by returning the default
            // cancelled token when cancellation happens
            // before someone asks for the token
            this._token = CancellationToken.Cancelled;
        }
        else {
            this._token.cancel();
        }
    }
    dispose() {
        this.cancel();
    }
}
exports.CancellationTokenSource = CancellationTokenSource;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/events.js":
/*!***************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/events.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
var Disposable;
(function (Disposable) {
    function create(func) {
        return {
            dispose: func
        };
    }
    Disposable.create = create;
})(Disposable = exports.Disposable || (exports.Disposable = {}));
var Event;
(function (Event) {
    const _disposable = { dispose() { } };
    Event.None = function () { return _disposable; };
})(Event = exports.Event || (exports.Event = {}));
class CallbackList {
    add(callback, context = null, bucket) {
        if (!this._callbacks) {
            this._callbacks = [];
            this._contexts = [];
        }
        this._callbacks.push(callback);
        this._contexts.push(context);
        if (Array.isArray(bucket)) {
            bucket.push({ dispose: () => this.remove(callback, context) });
        }
    }
    remove(callback, context = null) {
        if (!this._callbacks) {
            return;
        }
        var foundCallbackWithDifferentContext = false;
        for (var i = 0, len = this._callbacks.length; i < len; i++) {
            if (this._callbacks[i] === callback) {
                if (this._contexts[i] === context) {
                    // callback & context match => remove it
                    this._callbacks.splice(i, 1);
                    this._contexts.splice(i, 1);
                    return;
                }
                else {
                    foundCallbackWithDifferentContext = true;
                }
            }
        }
        if (foundCallbackWithDifferentContext) {
            throw new Error('When adding a listener with a context, you should remove it with the same context');
        }
    }
    invoke(...args) {
        if (!this._callbacks) {
            return [];
        }
        var ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
        for (var i = 0, len = callbacks.length; i < len; i++) {
            try {
                ret.push(callbacks[i].apply(contexts[i], args));
            }
            catch (e) {
                console.error(e);
            }
        }
        return ret;
    }
    isEmpty() {
        return !this._callbacks || this._callbacks.length === 0;
    }
    dispose() {
        this._callbacks = undefined;
        this._contexts = undefined;
    }
}
class Emitter {
    constructor(_options) {
        this._options = _options;
    }
    /**
     * For the public to allow to subscribe
     * to events from this Emitter
     */
    get event() {
        if (!this._event) {
            this._event = (listener, thisArgs, disposables) => {
                if (!this._callbacks) {
                    this._callbacks = new CallbackList();
                }
                if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
                    this._options.onFirstListenerAdd(this);
                }
                this._callbacks.add(listener, thisArgs);
                let result;
                result = {
                    dispose: () => {
                        this._callbacks.remove(listener, thisArgs);
                        result.dispose = Emitter._noop;
                        if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
                            this._options.onLastListenerRemove(this);
                        }
                    }
                };
                if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            };
        }
        return this._event;
    }
    /**
     * To be kept private to fire an event to
     * subscribers
     */
    fire(event) {
        if (this._callbacks) {
            this._callbacks.invoke.call(this._callbacks, event);
        }
    }
    dispose() {
        if (this._callbacks) {
            this._callbacks.dispose();
            this._callbacks = undefined;
        }
    }
}
Emitter._noop = function () { };
exports.Emitter = Emitter;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/is.js":
/*!***********************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/is.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
function boolean(value) {
    return value === true || value === false;
}
exports.boolean = boolean;
function string(value) {
    return typeof value === 'string' || value instanceof String;
}
exports.string = string;
function number(value) {
    return typeof value === 'number' || value instanceof Number;
}
exports.number = number;
function error(value) {
    return value instanceof Error;
}
exports.error = error;
function func(value) {
    return typeof value === 'function';
}
exports.func = func;
function array(value) {
    return Array.isArray(value);
}
exports.array = array;
function stringArray(value) {
    return array(value) && value.every(elem => string(elem));
}
exports.stringArray = stringArray;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/linkedMap.js":
/*!******************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/linkedMap.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
var Touch;
(function (Touch) {
    Touch.None = 0;
    Touch.First = 1;
    Touch.Last = 2;
})(Touch = exports.Touch || (exports.Touch = {}));
class LinkedMap {
    constructor() {
        this._map = new Map();
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
    }
    clear() {
        this._map.clear();
        this._head = undefined;
        this._tail = undefined;
        this._size = 0;
    }
    isEmpty() {
        return !this._head && !this._tail;
    }
    get size() {
        return this._size;
    }
    has(key) {
        return this._map.has(key);
    }
    get(key) {
        const item = this._map.get(key);
        if (!item) {
            return undefined;
        }
        return item.value;
    }
    set(key, value, touch = Touch.None) {
        let item = this._map.get(key);
        if (item) {
            item.value = value;
            if (touch !== Touch.None) {
                this.touch(item, touch);
            }
        }
        else {
            item = { key, value, next: undefined, previous: undefined };
            switch (touch) {
                case Touch.None:
                    this.addItemLast(item);
                    break;
                case Touch.First:
                    this.addItemFirst(item);
                    break;
                case Touch.Last:
                    this.addItemLast(item);
                    break;
                default:
                    this.addItemLast(item);
                    break;
            }
            this._map.set(key, item);
            this._size++;
        }
    }
    delete(key) {
        const item = this._map.get(key);
        if (!item) {
            return false;
        }
        this._map.delete(key);
        this.removeItem(item);
        this._size--;
        return true;
    }
    shift() {
        if (!this._head && !this._tail) {
            return undefined;
        }
        if (!this._head || !this._tail) {
            throw new Error('Invalid list');
        }
        const item = this._head;
        this._map.delete(item.key);
        this.removeItem(item);
        this._size--;
        return item.value;
    }
    forEach(callbackfn, thisArg) {
        let current = this._head;
        while (current) {
            if (thisArg) {
                callbackfn.bind(thisArg)(current.value, current.key, this);
            }
            else {
                callbackfn(current.value, current.key, this);
            }
            current = current.next;
        }
    }
    forEachReverse(callbackfn, thisArg) {
        let current = this._tail;
        while (current) {
            if (thisArg) {
                callbackfn.bind(thisArg)(current.value, current.key, this);
            }
            else {
                callbackfn(current.value, current.key, this);
            }
            current = current.previous;
        }
    }
    values() {
        let result = [];
        let current = this._head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }
    keys() {
        let result = [];
        let current = this._head;
        while (current) {
            result.push(current.key);
            current = current.next;
        }
        return result;
    }
    /* JSON RPC run on es5 which has no Symbol.iterator
    public keys(): IterableIterator<K> {
        let current = this._head;
        let iterator: IterableIterator<K> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next():IteratorResult<K> {
                if (current) {
                    let result = { value: current.key, done: false };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }

    public values(): IterableIterator<V> {
        let current = this._head;
        let iterator: IterableIterator<V> = {
            [Symbol.iterator]() {
                return iterator;
            },
            next():IteratorResult<V> {
                if (current) {
                    let result = { value: current.value, done: false };
                    current = current.next;
                    return result;
                } else {
                    return { value: undefined, done: true };
                }
            }
        };
        return iterator;
    }
    */
    addItemFirst(item) {
        // First time Insert
        if (!this._head && !this._tail) {
            this._tail = item;
        }
        else if (!this._head) {
            throw new Error('Invalid list');
        }
        else {
            item.next = this._head;
            this._head.previous = item;
        }
        this._head = item;
    }
    addItemLast(item) {
        // First time Insert
        if (!this._head && !this._tail) {
            this._head = item;
        }
        else if (!this._tail) {
            throw new Error('Invalid list');
        }
        else {
            item.previous = this._tail;
            this._tail.next = item;
        }
        this._tail = item;
    }
    removeItem(item) {
        if (item === this._head && item === this._tail) {
            this._head = undefined;
            this._tail = undefined;
        }
        else if (item === this._head) {
            this._head = item.next;
        }
        else if (item === this._tail) {
            this._tail = item.previous;
        }
        else {
            const next = item.next;
            const previous = item.previous;
            if (!next || !previous) {
                throw new Error('Invalid list');
            }
            next.previous = previous;
            previous.next = next;
        }
    }
    touch(item, touch) {
        if (!this._head || !this._tail) {
            throw new Error('Invalid list');
        }
        if ((touch !== Touch.First && touch !== Touch.Last)) {
            return;
        }
        if (touch === Touch.First) {
            if (item === this._head) {
                return;
            }
            const next = item.next;
            const previous = item.previous;
            // Unlink the item
            if (item === this._tail) {
                // previous must be defined since item was not head but is tail
                // So there are more than on item in the map
                previous.next = undefined;
                this._tail = previous;
            }
            else {
                // Both next and previous are not undefined since item was neither head nor tail.
                next.previous = previous;
                previous.next = next;
            }
            // Insert the node at head
            item.previous = undefined;
            item.next = this._head;
            this._head.previous = item;
            this._head = item;
        }
        else if (touch === Touch.Last) {
            if (item === this._tail) {
                return;
            }
            const next = item.next;
            const previous = item.previous;
            // Unlink the item.
            if (item === this._head) {
                // next must be defined since item was not tail but is head
                // So there are more than on item in the map
                next.previous = undefined;
                this._head = next;
            }
            else {
                // Both next and previous are not undefined since item was neither head nor tail.
                next.previous = previous;
                previous.next = next;
            }
            item.next = undefined;
            item.previous = this._tail;
            this._tail.next = item;
            this._tail = item;
        }
    }
}
exports.LinkedMap = LinkedMap;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/main.js":
/*!*************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/main.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="./thenable.ts" />

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const Is = __webpack_require__(/*! ./is */ "./node_modules/vscode-jsonrpc/lib/is.js");
const messages_1 = __webpack_require__(/*! ./messages */ "./node_modules/vscode-jsonrpc/lib/messages.js");
exports.RequestType = messages_1.RequestType;
exports.RequestType0 = messages_1.RequestType0;
exports.RequestType1 = messages_1.RequestType1;
exports.RequestType2 = messages_1.RequestType2;
exports.RequestType3 = messages_1.RequestType3;
exports.RequestType4 = messages_1.RequestType4;
exports.RequestType5 = messages_1.RequestType5;
exports.RequestType6 = messages_1.RequestType6;
exports.RequestType7 = messages_1.RequestType7;
exports.RequestType8 = messages_1.RequestType8;
exports.RequestType9 = messages_1.RequestType9;
exports.ResponseError = messages_1.ResponseError;
exports.ErrorCodes = messages_1.ErrorCodes;
exports.NotificationType = messages_1.NotificationType;
exports.NotificationType0 = messages_1.NotificationType0;
exports.NotificationType1 = messages_1.NotificationType1;
exports.NotificationType2 = messages_1.NotificationType2;
exports.NotificationType3 = messages_1.NotificationType3;
exports.NotificationType4 = messages_1.NotificationType4;
exports.NotificationType5 = messages_1.NotificationType5;
exports.NotificationType6 = messages_1.NotificationType6;
exports.NotificationType7 = messages_1.NotificationType7;
exports.NotificationType8 = messages_1.NotificationType8;
exports.NotificationType9 = messages_1.NotificationType9;
const messageReader_1 = __webpack_require__(/*! ./messageReader */ "./node_modules/vscode-jsonrpc/lib/messageReader.js");
exports.MessageReader = messageReader_1.MessageReader;
exports.StreamMessageReader = messageReader_1.StreamMessageReader;
exports.IPCMessageReader = messageReader_1.IPCMessageReader;
exports.SocketMessageReader = messageReader_1.SocketMessageReader;
const messageWriter_1 = __webpack_require__(/*! ./messageWriter */ "./node_modules/vscode-jsonrpc/lib/messageWriter.js");
exports.MessageWriter = messageWriter_1.MessageWriter;
exports.StreamMessageWriter = messageWriter_1.StreamMessageWriter;
exports.IPCMessageWriter = messageWriter_1.IPCMessageWriter;
exports.SocketMessageWriter = messageWriter_1.SocketMessageWriter;
const events_1 = __webpack_require__(/*! ./events */ "./node_modules/vscode-jsonrpc/lib/events.js");
exports.Disposable = events_1.Disposable;
exports.Event = events_1.Event;
exports.Emitter = events_1.Emitter;
const cancellation_1 = __webpack_require__(/*! ./cancellation */ "./node_modules/vscode-jsonrpc/lib/cancellation.js");
exports.CancellationTokenSource = cancellation_1.CancellationTokenSource;
exports.CancellationToken = cancellation_1.CancellationToken;
const linkedMap_1 = __webpack_require__(/*! ./linkedMap */ "./node_modules/vscode-jsonrpc/lib/linkedMap.js");
__export(__webpack_require__(/*! ./pipeSupport */ "./node_modules/vscode-jsonrpc/lib/pipeSupport.js"));
__export(__webpack_require__(/*! ./socketSupport */ "./node_modules/vscode-jsonrpc/lib/socketSupport.js"));
var CancelNotification;
(function (CancelNotification) {
    CancelNotification.type = new messages_1.NotificationType('$/cancelRequest');
})(CancelNotification || (CancelNotification = {}));
exports.NullLogger = Object.freeze({
    error: () => { },
    warn: () => { },
    info: () => { },
    log: () => { }
});
var Trace;
(function (Trace) {
    Trace[Trace["Off"] = 0] = "Off";
    Trace[Trace["Messages"] = 1] = "Messages";
    Trace[Trace["Verbose"] = 2] = "Verbose";
})(Trace = exports.Trace || (exports.Trace = {}));
(function (Trace) {
    function fromString(value) {
        value = value.toLowerCase();
        switch (value) {
            case 'off':
                return Trace.Off;
            case 'messages':
                return Trace.Messages;
            case 'verbose':
                return Trace.Verbose;
            default:
                return Trace.Off;
        }
    }
    Trace.fromString = fromString;
    function toString(value) {
        switch (value) {
            case Trace.Off:
                return 'off';
            case Trace.Messages:
                return 'messages';
            case Trace.Verbose:
                return 'verbose';
            default:
                return 'off';
        }
    }
    Trace.toString = toString;
})(Trace = exports.Trace || (exports.Trace = {}));
var TraceFormat;
(function (TraceFormat) {
    TraceFormat["Text"] = "text";
    TraceFormat["JSON"] = "json";
})(TraceFormat = exports.TraceFormat || (exports.TraceFormat = {}));
(function (TraceFormat) {
    function fromString(value) {
        value = value.toLowerCase();
        if (value === 'json') {
            return TraceFormat.JSON;
        }
        else {
            return TraceFormat.Text;
        }
    }
    TraceFormat.fromString = fromString;
})(TraceFormat = exports.TraceFormat || (exports.TraceFormat = {}));
var SetTraceNotification;
(function (SetTraceNotification) {
    SetTraceNotification.type = new messages_1.NotificationType('$/setTraceNotification');
})(SetTraceNotification = exports.SetTraceNotification || (exports.SetTraceNotification = {}));
var LogTraceNotification;
(function (LogTraceNotification) {
    LogTraceNotification.type = new messages_1.NotificationType('$/logTraceNotification');
})(LogTraceNotification = exports.LogTraceNotification || (exports.LogTraceNotification = {}));
var ConnectionErrors;
(function (ConnectionErrors) {
    /**
     * The connection is closed.
     */
    ConnectionErrors[ConnectionErrors["Closed"] = 1] = "Closed";
    /**
     * The connection got disposed.
     */
    ConnectionErrors[ConnectionErrors["Disposed"] = 2] = "Disposed";
    /**
     * The connection is already in listening mode.
     */
    ConnectionErrors[ConnectionErrors["AlreadyListening"] = 3] = "AlreadyListening";
})(ConnectionErrors = exports.ConnectionErrors || (exports.ConnectionErrors = {}));
class ConnectionError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        Object.setPrototypeOf(this, ConnectionError.prototype);
    }
}
exports.ConnectionError = ConnectionError;
var ConnectionStrategy;
(function (ConnectionStrategy) {
    function is(value) {
        let candidate = value;
        return candidate && Is.func(candidate.cancelUndispatched);
    }
    ConnectionStrategy.is = is;
})(ConnectionStrategy = exports.ConnectionStrategy || (exports.ConnectionStrategy = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["New"] = 1] = "New";
    ConnectionState[ConnectionState["Listening"] = 2] = "Listening";
    ConnectionState[ConnectionState["Closed"] = 3] = "Closed";
    ConnectionState[ConnectionState["Disposed"] = 4] = "Disposed";
})(ConnectionState || (ConnectionState = {}));
function _createMessageConnection(messageReader, messageWriter, logger, strategy) {
    let sequenceNumber = 0;
    let notificationSquenceNumber = 0;
    let unknownResponseSquenceNumber = 0;
    const version = '2.0';
    let starRequestHandler = undefined;
    let requestHandlers = Object.create(null);
    let starNotificationHandler = undefined;
    let notificationHandlers = Object.create(null);
    let timer;
    let messageQueue = new linkedMap_1.LinkedMap();
    let responsePromises = Object.create(null);
    let requestTokens = Object.create(null);
    let trace = Trace.Off;
    let traceFormat = TraceFormat.Text;
    let tracer;
    let state = ConnectionState.New;
    let errorEmitter = new events_1.Emitter();
    let closeEmitter = new events_1.Emitter();
    let unhandledNotificationEmitter = new events_1.Emitter();
    let disposeEmitter = new events_1.Emitter();
    function createRequestQueueKey(id) {
        return 'req-' + id.toString();
    }
    function createResponseQueueKey(id) {
        if (id === null) {
            return 'res-unknown-' + (++unknownResponseSquenceNumber).toString();
        }
        else {
            return 'res-' + id.toString();
        }
    }
    function createNotificationQueueKey() {
        return 'not-' + (++notificationSquenceNumber).toString();
    }
    function addMessageToQueue(queue, message) {
        if (messages_1.isRequestMessage(message)) {
            queue.set(createRequestQueueKey(message.id), message);
        }
        else if (messages_1.isResponseMessage(message)) {
            queue.set(createResponseQueueKey(message.id), message);
        }
        else {
            queue.set(createNotificationQueueKey(), message);
        }
    }
    function cancelUndispatched(_message) {
        return undefined;
    }
    function isListening() {
        return state === ConnectionState.Listening;
    }
    function isClosed() {
        return state === ConnectionState.Closed;
    }
    function isDisposed() {
        return state === ConnectionState.Disposed;
    }
    function closeHandler() {
        if (state === ConnectionState.New || state === ConnectionState.Listening) {
            state = ConnectionState.Closed;
            closeEmitter.fire(undefined);
        }
        // If the connection is disposed don't sent close events.
    }
    ;
    function readErrorHandler(error) {
        errorEmitter.fire([error, undefined, undefined]);
    }
    function writeErrorHandler(data) {
        errorEmitter.fire(data);
    }
    messageReader.onClose(closeHandler);
    messageReader.onError(readErrorHandler);
    messageWriter.onClose(closeHandler);
    messageWriter.onError(writeErrorHandler);
    function triggerMessageQueue() {
        if (timer || messageQueue.size === 0) {
            return;
        }
        timer = setImmediate(() => {
            timer = undefined;
            processMessageQueue();
        });
    }
    function processMessageQueue() {
        if (messageQueue.size === 0) {
            return;
        }
        let message = messageQueue.shift();
        try {
            if (messages_1.isRequestMessage(message)) {
                handleRequest(message);
            }
            else if (messages_1.isNotificationMessage(message)) {
                handleNotification(message);
            }
            else if (messages_1.isResponseMessage(message)) {
                handleResponse(message);
            }
            else {
                handleInvalidMessage(message);
            }
        }
        finally {
            triggerMessageQueue();
        }
    }
    let callback = (message) => {
        try {
            // We have received a cancellation message. Check if the message is still in the queue
            // and cancel it if allowed to do so.
            if (messages_1.isNotificationMessage(message) && message.method === CancelNotification.type.method) {
                let key = createRequestQueueKey(message.params.id);
                let toCancel = messageQueue.get(key);
                if (messages_1.isRequestMessage(toCancel)) {
                    let response = strategy && strategy.cancelUndispatched ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
                    if (response && (response.error !== void 0 || response.result !== void 0)) {
                        messageQueue.delete(key);
                        response.id = toCancel.id;
                        traceSendingResponse(response, message.method, Date.now());
                        messageWriter.write(response);
                        return;
                    }
                }
            }
            addMessageToQueue(messageQueue, message);
        }
        finally {
            triggerMessageQueue();
        }
    };
    function handleRequest(requestMessage) {
        if (isDisposed()) {
            // we return here silently since we fired an event when the
            // connection got disposed.
            return;
        }
        function reply(resultOrError, method, startTime) {
            let message = {
                jsonrpc: version,
                id: requestMessage.id
            };
            if (resultOrError instanceof messages_1.ResponseError) {
                message.error = resultOrError.toJson();
            }
            else {
                message.result = resultOrError === void 0 ? null : resultOrError;
            }
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message);
        }
        function replyError(error, method, startTime) {
            let message = {
                jsonrpc: version,
                id: requestMessage.id,
                error: error.toJson()
            };
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message);
        }
        function replySuccess(result, method, startTime) {
            // The JSON RPC defines that a response must either have a result or an error
            // So we can't treat undefined as a valid response result.
            if (result === void 0) {
                result = null;
            }
            let message = {
                jsonrpc: version,
                id: requestMessage.id,
                result: result
            };
            traceSendingResponse(message, method, startTime);
            messageWriter.write(message);
        }
        traceReceivedRequest(requestMessage);
        let element = requestHandlers[requestMessage.method];
        let type;
        let requestHandler;
        if (element) {
            type = element.type;
            requestHandler = element.handler;
        }
        let startTime = Date.now();
        if (requestHandler || starRequestHandler) {
            let cancellationSource = new cancellation_1.CancellationTokenSource();
            let tokenKey = String(requestMessage.id);
            requestTokens[tokenKey] = cancellationSource;
            try {
                let handlerResult;
                if (requestMessage.params === void 0 || (type !== void 0 && type.numberOfParams === 0)) {
                    handlerResult = requestHandler
                        ? requestHandler(cancellationSource.token)
                        : starRequestHandler(requestMessage.method, cancellationSource.token);
                }
                else if (Is.array(requestMessage.params) && (type === void 0 || type.numberOfParams > 1)) {
                    handlerResult = requestHandler
                        ? requestHandler(...requestMessage.params, cancellationSource.token)
                        : starRequestHandler(requestMessage.method, ...requestMessage.params, cancellationSource.token);
                }
                else {
                    handlerResult = requestHandler
                        ? requestHandler(requestMessage.params, cancellationSource.token)
                        : starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
                }
                let promise = handlerResult;
                if (!handlerResult) {
                    delete requestTokens[tokenKey];
                    replySuccess(handlerResult, requestMessage.method, startTime);
                }
                else if (promise.then) {
                    promise.then((resultOrError) => {
                        delete requestTokens[tokenKey];
                        reply(resultOrError, requestMessage.method, startTime);
                    }, error => {
                        delete requestTokens[tokenKey];
                        if (error instanceof messages_1.ResponseError) {
                            replyError(error, requestMessage.method, startTime);
                        }
                        else if (error && Is.string(error.message)) {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
                        }
                        else {
                            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
                        }
                    });
                }
                else {
                    delete requestTokens[tokenKey];
                    reply(handlerResult, requestMessage.method, startTime);
                }
            }
            catch (error) {
                delete requestTokens[tokenKey];
                if (error instanceof messages_1.ResponseError) {
                    reply(error, requestMessage.method, startTime);
                }
                else if (error && Is.string(error.message)) {
                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
                }
                else {
                    replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
                }
            }
        }
        else {
            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
        }
    }
    function handleResponse(responseMessage) {
        if (isDisposed()) {
            // See handle request.
            return;
        }
        if (responseMessage.id === null) {
            if (responseMessage.error) {
                logger.error(`Received response message without id: Error is: \n${JSON.stringify(responseMessage.error, undefined, 4)}`);
            }
            else {
                logger.error(`Received response message without id. No further error information provided.`);
            }
        }
        else {
            let key = String(responseMessage.id);
            let responsePromise = responsePromises[key];
            traceReceivedResponse(responseMessage, responsePromise);
            if (responsePromise) {
                delete responsePromises[key];
                try {
                    if (responseMessage.error) {
                        let error = responseMessage.error;
                        responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
                    }
                    else if (responseMessage.result !== void 0) {
                        responsePromise.resolve(responseMessage.result);
                    }
                    else {
                        throw new Error('Should never happen.');
                    }
                }
                catch (error) {
                    if (error.message) {
                        logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
                    }
                    else {
                        logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
                    }
                }
            }
        }
    }
    function handleNotification(message) {
        if (isDisposed()) {
            // See handle request.
            return;
        }
        let type = undefined;
        let notificationHandler;
        if (message.method === CancelNotification.type.method) {
            notificationHandler = (params) => {
                let id = params.id;
                let source = requestTokens[String(id)];
                if (source) {
                    source.cancel();
                }
            };
        }
        else {
            let element = notificationHandlers[message.method];
            if (element) {
                notificationHandler = element.handler;
                type = element.type;
            }
        }
        if (notificationHandler || starNotificationHandler) {
            try {
                traceReceivedNotification(message);
                if (message.params === void 0 || (type !== void 0 && type.numberOfParams === 0)) {
                    notificationHandler ? notificationHandler() : starNotificationHandler(message.method);
                }
                else if (Is.array(message.params) && (type === void 0 || type.numberOfParams > 1)) {
                    notificationHandler ? notificationHandler(...message.params) : starNotificationHandler(message.method, ...message.params);
                }
                else {
                    notificationHandler ? notificationHandler(message.params) : starNotificationHandler(message.method, message.params);
                }
            }
            catch (error) {
                if (error.message) {
                    logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
                }
                else {
                    logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
                }
            }
        }
        else {
            unhandledNotificationEmitter.fire(message);
        }
    }
    function handleInvalidMessage(message) {
        if (!message) {
            logger.error('Received empty message.');
            return;
        }
        logger.error(`Received message which is neither a response nor a notification message:\n${JSON.stringify(message, null, 4)}`);
        // Test whether we find an id to reject the promise
        let responseMessage = message;
        if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
            let key = String(responseMessage.id);
            let responseHandler = responsePromises[key];
            if (responseHandler) {
                responseHandler.reject(new Error('The received response has neither a result nor an error property.'));
            }
        }
    }
    function traceSendingRequest(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose && message.params) {
                data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
            }
            tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
        }
        else {
            logLSPMessage('send-request', message);
        }
    }
    function traceSendingNotification(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose) {
                if (message.params) {
                    data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
                }
                else {
                    data = 'No parameters provided.\n\n';
                }
            }
            tracer.log(`Sending notification '${message.method}'.`, data);
        }
        else {
            logLSPMessage('send-notification', message);
        }
    }
    function traceSendingResponse(message, method, startTime) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose) {
                if (message.error && message.error.data) {
                    data = `Error data: ${JSON.stringify(message.error.data, null, 4)}\n\n`;
                }
                else {
                    if (message.result) {
                        data = `Result: ${JSON.stringify(message.result, null, 4)}\n\n`;
                    }
                    else if (message.error === void 0) {
                        data = 'No result returned.\n\n';
                    }
                }
            }
            tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms`, data);
        }
        else {
            logLSPMessage('send-response', message);
        }
    }
    function traceReceivedRequest(message) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose && message.params) {
                data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
            }
            tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
        }
        else {
            logLSPMessage('receive-request', message);
        }
    }
    function traceReceivedNotification(message) {
        if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose) {
                if (message.params) {
                    data = `Params: ${JSON.stringify(message.params, null, 4)}\n\n`;
                }
                else {
                    data = 'No parameters provided.\n\n';
                }
            }
            tracer.log(`Received notification '${message.method}'.`, data);
        }
        else {
            logLSPMessage('receive-notification', message);
        }
    }
    function traceReceivedResponse(message, responsePromise) {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        if (traceFormat === TraceFormat.Text) {
            let data = undefined;
            if (trace === Trace.Verbose) {
                if (message.error && message.error.data) {
                    data = `Error data: ${JSON.stringify(message.error.data, null, 4)}\n\n`;
                }
                else {
                    if (message.result) {
                        data = `Result: ${JSON.stringify(message.result, null, 4)}\n\n`;
                    }
                    else if (message.error === void 0) {
                        data = 'No result returned.\n\n';
                    }
                }
            }
            if (responsePromise) {
                let error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : '';
                tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
            }
            else {
                tracer.log(`Received response ${message.id} without active response promise.`, data);
            }
        }
        else {
            logLSPMessage('receive-response', message);
        }
    }
    function logLSPMessage(type, message) {
        if (!tracer || trace === Trace.Off) {
            return;
        }
        const lspMessage = {
            isLSPMessage: true,
            type,
            message,
            timestamp: Date.now()
        };
        tracer.log(lspMessage);
    }
    function throwIfClosedOrDisposed() {
        if (isClosed()) {
            throw new ConnectionError(ConnectionErrors.Closed, 'Connection is closed.');
        }
        if (isDisposed()) {
            throw new ConnectionError(ConnectionErrors.Disposed, 'Connection is disposed.');
        }
    }
    function throwIfListening() {
        if (isListening()) {
            throw new ConnectionError(ConnectionErrors.AlreadyListening, 'Connection is already listening');
        }
    }
    function throwIfNotListening() {
        if (!isListening()) {
            throw new Error('Call listen() first.');
        }
    }
    function undefinedToNull(param) {
        if (param === void 0) {
            return null;
        }
        else {
            return param;
        }
    }
    function computeMessageParams(type, params) {
        let result;
        let numberOfParams = type.numberOfParams;
        switch (numberOfParams) {
            case 0:
                result = null;
                break;
            case 1:
                result = undefinedToNull(params[0]);
                break;
            default:
                result = [];
                for (let i = 0; i < params.length && i < numberOfParams; i++) {
                    result.push(undefinedToNull(params[i]));
                }
                if (params.length < numberOfParams) {
                    for (let i = params.length; i < numberOfParams; i++) {
                        result.push(null);
                    }
                }
                break;
        }
        return result;
    }
    let connection = {
        sendNotification: (type, ...params) => {
            throwIfClosedOrDisposed();
            let method;
            let messageParams;
            if (Is.string(type)) {
                method = type;
                switch (params.length) {
                    case 0:
                        messageParams = null;
                        break;
                    case 1:
                        messageParams = params[0];
                        break;
                    default:
                        messageParams = params;
                        break;
                }
            }
            else {
                method = type.method;
                messageParams = computeMessageParams(type, params);
            }
            let notificationMessage = {
                jsonrpc: version,
                method: method,
                params: messageParams
            };
            traceSendingNotification(notificationMessage);
            messageWriter.write(notificationMessage);
        },
        onNotification: (type, handler) => {
            throwIfClosedOrDisposed();
            if (Is.func(type)) {
                starNotificationHandler = type;
            }
            else if (handler) {
                if (Is.string(type)) {
                    notificationHandlers[type] = { type: undefined, handler };
                }
                else {
                    notificationHandlers[type.method] = { type, handler };
                }
            }
        },
        sendRequest: (type, ...params) => {
            throwIfClosedOrDisposed();
            throwIfNotListening();
            let method;
            let messageParams;
            let token = undefined;
            if (Is.string(type)) {
                method = type;
                switch (params.length) {
                    case 0:
                        messageParams = null;
                        break;
                    case 1:
                        // The cancellation token is optional so it can also be undefined.
                        if (cancellation_1.CancellationToken.is(params[0])) {
                            messageParams = null;
                            token = params[0];
                        }
                        else {
                            messageParams = undefinedToNull(params[0]);
                        }
                        break;
                    default:
                        const last = params.length - 1;
                        if (cancellation_1.CancellationToken.is(params[last])) {
                            token = params[last];
                            if (params.length === 2) {
                                messageParams = undefinedToNull(params[0]);
                            }
                            else {
                                messageParams = params.slice(0, last).map(value => undefinedToNull(value));
                            }
                        }
                        else {
                            messageParams = params.map(value => undefinedToNull(value));
                        }
                        break;
                }
            }
            else {
                method = type.method;
                messageParams = computeMessageParams(type, params);
                let numberOfParams = type.numberOfParams;
                token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : undefined;
            }
            let id = sequenceNumber++;
            let result = new Promise((resolve, reject) => {
                let requestMessage = {
                    jsonrpc: version,
                    id: id,
                    method: method,
                    params: messageParams
                };
                let responsePromise = { method: method, timerStart: Date.now(), resolve, reject };
                traceSendingRequest(requestMessage);
                try {
                    messageWriter.write(requestMessage);
                }
                catch (e) {
                    // Writing the message failed. So we need to reject the promise.
                    responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, e.message ? e.message : 'Unknown reason'));
                    responsePromise = null;
                }
                if (responsePromise) {
                    responsePromises[String(id)] = responsePromise;
                }
            });
            if (token) {
                token.onCancellationRequested(() => {
                    connection.sendNotification(CancelNotification.type, { id });
                });
            }
            return result;
        },
        onRequest: (type, handler) => {
            throwIfClosedOrDisposed();
            if (Is.func(type)) {
                starRequestHandler = type;
            }
            else if (handler) {
                if (Is.string(type)) {
                    requestHandlers[type] = { type: undefined, handler };
                }
                else {
                    requestHandlers[type.method] = { type, handler };
                }
            }
        },
        trace: (_value, _tracer, sendNotificationOrTraceOptions) => {
            let _sendNotification = false;
            let _traceFormat = TraceFormat.Text;
            if (sendNotificationOrTraceOptions !== void 0) {
                if (Is.boolean(sendNotificationOrTraceOptions)) {
                    _sendNotification = sendNotificationOrTraceOptions;
                }
                else {
                    _sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
                    _traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
                }
            }
            trace = _value;
            traceFormat = _traceFormat;
            if (trace === Trace.Off) {
                tracer = undefined;
            }
            else {
                tracer = _tracer;
            }
            if (_sendNotification && !isClosed() && !isDisposed()) {
                connection.sendNotification(SetTraceNotification.type, { value: Trace.toString(_value) });
            }
        },
        onError: errorEmitter.event,
        onClose: closeEmitter.event,
        onUnhandledNotification: unhandledNotificationEmitter.event,
        onDispose: disposeEmitter.event,
        dispose: () => {
            if (isDisposed()) {
                return;
            }
            state = ConnectionState.Disposed;
            disposeEmitter.fire(undefined);
            let error = new Error('Connection got disposed.');
            Object.keys(responsePromises).forEach((key) => {
                responsePromises[key].reject(error);
            });
            responsePromises = Object.create(null);
            requestTokens = Object.create(null);
            messageQueue = new linkedMap_1.LinkedMap();
            // Test for backwards compatibility
            if (Is.func(messageWriter.dispose)) {
                messageWriter.dispose();
            }
            if (Is.func(messageReader.dispose)) {
                messageReader.dispose();
            }
        },
        listen: () => {
            throwIfClosedOrDisposed();
            throwIfListening();
            state = ConnectionState.Listening;
            messageReader.listen(callback);
        },
        inspect: () => {
            console.log("inspect");
        }
    };
    connection.onNotification(LogTraceNotification.type, (params) => {
        if (trace === Trace.Off || !tracer) {
            return;
        }
        tracer.log(params.message, trace === Trace.Verbose ? params.verbose : undefined);
    });
    return connection;
}
function isMessageReader(value) {
    return value.listen !== void 0 && value.read === void 0;
}
function isMessageWriter(value) {
    return value.write !== void 0 && value.end === void 0;
}
function createMessageConnection(input, output, logger, strategy) {
    if (!logger) {
        logger = exports.NullLogger;
    }
    let reader = isMessageReader(input) ? input : new messageReader_1.StreamMessageReader(input);
    let writer = isMessageWriter(output) ? output : new messageWriter_1.StreamMessageWriter(output);
    return _createMessageConnection(reader, writer, logger, strategy);
}
exports.createMessageConnection = createMessageConnection;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/messageReader.js":
/*!**********************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/messageReader.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __webpack_require__(/*! ./events */ "./node_modules/vscode-jsonrpc/lib/events.js");
const Is = __webpack_require__(/*! ./is */ "./node_modules/vscode-jsonrpc/lib/is.js");
let DefaultSize = 8192;
let CR = Buffer.from('\r', 'ascii')[0];
let LF = Buffer.from('\n', 'ascii')[0];
let CRLF = '\r\n';
class MessageBuffer {
    constructor(encoding = 'utf8') {
        this.encoding = encoding;
        this.index = 0;
        this.buffer = Buffer.allocUnsafe(DefaultSize);
    }
    append(chunk) {
        var toAppend = chunk;
        if (typeof (chunk) === 'string') {
            var str = chunk;
            var bufferLen = Buffer.byteLength(str, this.encoding);
            toAppend = Buffer.allocUnsafe(bufferLen);
            toAppend.write(str, 0, bufferLen, this.encoding);
        }
        if (this.buffer.length - this.index >= toAppend.length) {
            toAppend.copy(this.buffer, this.index, 0, toAppend.length);
        }
        else {
            var newSize = (Math.ceil((this.index + toAppend.length) / DefaultSize) + 1) * DefaultSize;
            if (this.index === 0) {
                this.buffer = Buffer.allocUnsafe(newSize);
                toAppend.copy(this.buffer, 0, 0, toAppend.length);
            }
            else {
                this.buffer = Buffer.concat([this.buffer.slice(0, this.index), toAppend], newSize);
            }
        }
        this.index += toAppend.length;
    }
    tryReadHeaders() {
        let result = undefined;
        let current = 0;
        while (current + 3 < this.index && (this.buffer[current] !== CR || this.buffer[current + 1] !== LF || this.buffer[current + 2] !== CR || this.buffer[current + 3] !== LF)) {
            current++;
        }
        // No header / body separator found (e.g CRLFCRLF)
        if (current + 3 >= this.index) {
            return result;
        }
        result = Object.create(null);
        let headers = this.buffer.toString('ascii', 0, current).split(CRLF);
        headers.forEach((header) => {
            let index = header.indexOf(':');
            if (index === -1) {
                throw new Error('Message header must separate key and value using :');
            }
            let key = header.substr(0, index);
            let value = header.substr(index + 1).trim();
            result[key] = value;
        });
        let nextStart = current + 4;
        this.buffer = this.buffer.slice(nextStart);
        this.index = this.index - nextStart;
        return result;
    }
    tryReadContent(length) {
        if (this.index < length) {
            return null;
        }
        let result = this.buffer.toString(this.encoding, 0, length);
        let nextStart = length;
        this.buffer.copy(this.buffer, 0, nextStart);
        this.index = this.index - nextStart;
        return result;
    }
    get numberOfBytes() {
        return this.index;
    }
}
var MessageReader;
(function (MessageReader) {
    function is(value) {
        let candidate = value;
        return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) &&
            Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
    }
    MessageReader.is = is;
})(MessageReader = exports.MessageReader || (exports.MessageReader = {}));
class AbstractMessageReader {
    constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
        this.partialMessageEmitter = new events_1.Emitter();
    }
    dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
    }
    get onError() {
        return this.errorEmitter.event;
    }
    fireError(error) {
        this.errorEmitter.fire(this.asError(error));
    }
    get onClose() {
        return this.closeEmitter.event;
    }
    fireClose() {
        this.closeEmitter.fire(undefined);
    }
    get onPartialMessage() {
        return this.partialMessageEmitter.event;
    }
    firePartialMessage(info) {
        this.partialMessageEmitter.fire(info);
    }
    asError(error) {
        if (error instanceof Error) {
            return error;
        }
        else {
            return new Error(`Reader recevied error. Reason: ${Is.string(error.message) ? error.message : 'unknown'}`);
        }
    }
}
exports.AbstractMessageReader = AbstractMessageReader;
class StreamMessageReader extends AbstractMessageReader {
    constructor(readable, encoding = 'utf8') {
        super();
        this.readable = readable;
        this.buffer = new MessageBuffer(encoding);
        this._partialMessageTimeout = 10000;
    }
    set partialMessageTimeout(timeout) {
        this._partialMessageTimeout = timeout;
    }
    get partialMessageTimeout() {
        return this._partialMessageTimeout;
    }
    listen(callback) {
        this.nextMessageLength = -1;
        this.messageToken = 0;
        this.partialMessageTimer = undefined;
        this.callback = callback;
        this.readable.on('data', (data) => {
            this.onData(data);
        });
        this.readable.on('error', (error) => this.fireError(error));
        this.readable.on('close', () => this.fireClose());
    }
    onData(data) {
        this.buffer.append(data);
        while (true) {
            if (this.nextMessageLength === -1) {
                let headers = this.buffer.tryReadHeaders();
                if (!headers) {
                    return;
                }
                let contentLength = headers['Content-Length'];
                if (!contentLength) {
                    throw new Error('Header must provide a Content-Length property.');
                }
                let length = parseInt(contentLength);
                if (isNaN(length)) {
                    throw new Error('Content-Length value must be a number.');
                }
                this.nextMessageLength = length;
                // Take the encoding form the header. For compatibility
                // treat both utf-8 and utf8 as node utf8
            }
            var msg = this.buffer.tryReadContent(this.nextMessageLength);
            if (msg === null) {
                /** We haven't recevied the full message yet. */
                this.setPartialMessageTimer();
                return;
            }
            this.clearPartialMessageTimer();
            this.nextMessageLength = -1;
            this.messageToken++;
            var json = JSON.parse(msg);
            this.callback(json);
        }
    }
    clearPartialMessageTimer() {
        if (this.partialMessageTimer) {
            clearTimeout(this.partialMessageTimer);
            this.partialMessageTimer = undefined;
        }
    }
    setPartialMessageTimer() {
        this.clearPartialMessageTimer();
        if (this._partialMessageTimeout <= 0) {
            return;
        }
        this.partialMessageTimer = setTimeout((token, timeout) => {
            this.partialMessageTimer = undefined;
            if (token === this.messageToken) {
                this.firePartialMessage({ messageToken: token, waitingTime: timeout });
                this.setPartialMessageTimer();
            }
        }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
    }
}
exports.StreamMessageReader = StreamMessageReader;
class IPCMessageReader extends AbstractMessageReader {
    constructor(process) {
        super();
        this.process = process;
        let eventEmitter = this.process;
        eventEmitter.on('error', (error) => this.fireError(error));
        eventEmitter.on('close', () => this.fireClose());
    }
    listen(callback) {
        this.process.on('message', callback);
    }
}
exports.IPCMessageReader = IPCMessageReader;
class SocketMessageReader extends StreamMessageReader {
    constructor(socket, encoding = 'utf-8') {
        super(socket, encoding);
    }
}
exports.SocketMessageReader = SocketMessageReader;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/messageWriter.js":
/*!**********************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/messageWriter.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __webpack_require__(/*! ./events */ "./node_modules/vscode-jsonrpc/lib/events.js");
const Is = __webpack_require__(/*! ./is */ "./node_modules/vscode-jsonrpc/lib/is.js");
let ContentLength = 'Content-Length: ';
let CRLF = '\r\n';
var MessageWriter;
(function (MessageWriter) {
    function is(value) {
        let candidate = value;
        return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) &&
            Is.func(candidate.onError) && Is.func(candidate.write);
    }
    MessageWriter.is = is;
})(MessageWriter = exports.MessageWriter || (exports.MessageWriter = {}));
class AbstractMessageWriter {
    constructor() {
        this.errorEmitter = new events_1.Emitter();
        this.closeEmitter = new events_1.Emitter();
    }
    dispose() {
        this.errorEmitter.dispose();
        this.closeEmitter.dispose();
    }
    get onError() {
        return this.errorEmitter.event;
    }
    fireError(error, message, count) {
        this.errorEmitter.fire([this.asError(error), message, count]);
    }
    get onClose() {
        return this.closeEmitter.event;
    }
    fireClose() {
        this.closeEmitter.fire(undefined);
    }
    asError(error) {
        if (error instanceof Error) {
            return error;
        }
        else {
            return new Error(`Writer recevied error. Reason: ${Is.string(error.message) ? error.message : 'unknown'}`);
        }
    }
}
exports.AbstractMessageWriter = AbstractMessageWriter;
class StreamMessageWriter extends AbstractMessageWriter {
    constructor(writable, encoding = 'utf8') {
        super();
        this.writable = writable;
        this.encoding = encoding;
        this.errorCount = 0;
        this.writable.on('error', (error) => this.fireError(error));
        this.writable.on('close', () => this.fireClose());
    }
    write(msg) {
        let json = JSON.stringify(msg);
        let contentLength = Buffer.byteLength(json, this.encoding);
        let headers = [
            ContentLength, contentLength.toString(), CRLF,
            CRLF
        ];
        try {
            // Header must be written in ASCII encoding
            this.writable.write(headers.join(''), 'ascii');
            // Now write the content. This can be written in any encoding
            this.writable.write(json, this.encoding);
            this.errorCount = 0;
        }
        catch (error) {
            this.errorCount++;
            this.fireError(error, msg, this.errorCount);
        }
    }
}
exports.StreamMessageWriter = StreamMessageWriter;
class IPCMessageWriter extends AbstractMessageWriter {
    constructor(process) {
        super();
        this.process = process;
        this.errorCount = 0;
        this.queue = [];
        this.sending = false;
        let eventEmitter = this.process;
        eventEmitter.on('error', (error) => this.fireError(error));
        eventEmitter.on('close', () => this.fireClose);
    }
    write(msg) {
        if (!this.sending && this.queue.length === 0) {
            // See https://github.com/nodejs/node/issues/7657
            this.doWriteMessage(msg);
        }
        else {
            this.queue.push(msg);
        }
    }
    doWriteMessage(msg) {
        try {
            if (this.process.send) {
                this.sending = true;
                this.process.send(msg, undefined, undefined, (error) => {
                    this.sending = false;
                    if (error) {
                        this.errorCount++;
                        this.fireError(error, msg, this.errorCount);
                    }
                    else {
                        this.errorCount = 0;
                    }
                    if (this.queue.length > 0) {
                        this.doWriteMessage(this.queue.shift());
                    }
                });
            }
        }
        catch (error) {
            this.errorCount++;
            this.fireError(error, msg, this.errorCount);
        }
    }
}
exports.IPCMessageWriter = IPCMessageWriter;
class SocketMessageWriter extends AbstractMessageWriter {
    constructor(socket, encoding = 'utf8') {
        super();
        this.socket = socket;
        this.queue = [];
        this.sending = false;
        this.encoding = encoding;
        this.errorCount = 0;
        this.socket.on('error', (error) => this.fireError(error));
        this.socket.on('close', () => this.fireClose());
    }
    write(msg) {
        if (!this.sending && this.queue.length === 0) {
            // See https://github.com/nodejs/node/issues/7657
            this.doWriteMessage(msg);
        }
        else {
            this.queue.push(msg);
        }
    }
    doWriteMessage(msg) {
        let json = JSON.stringify(msg);
        let contentLength = Buffer.byteLength(json, this.encoding);
        let headers = [
            ContentLength, contentLength.toString(), CRLF,
            CRLF
        ];
        try {
            // Header must be written in ASCII encoding
            this.sending = true;
            this.socket.write(headers.join(''), 'ascii', (error) => {
                if (error) {
                    this.handleError(error, msg);
                }
                try {
                    // Now write the content. This can be written in any encoding
                    this.socket.write(json, this.encoding, (error) => {
                        this.sending = false;
                        if (error) {
                            this.handleError(error, msg);
                        }
                        else {
                            this.errorCount = 0;
                        }
                        if (this.queue.length > 0) {
                            this.doWriteMessage(this.queue.shift());
                        }
                    });
                }
                catch (error) {
                    this.handleError(error, msg);
                }
            });
        }
        catch (error) {
            this.handleError(error, msg);
        }
    }
    handleError(error, msg) {
        this.errorCount++;
        this.fireError(error, msg, this.errorCount);
    }
}
exports.SocketMessageWriter = SocketMessageWriter;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/messages.js":
/*!*****************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/messages.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const is = __webpack_require__(/*! ./is */ "./node_modules/vscode-jsonrpc/lib/is.js");
/**
 * Predefined error codes.
 */
var ErrorCodes;
(function (ErrorCodes) {
    // Defined by JSON RPC
    ErrorCodes.ParseError = -32700;
    ErrorCodes.InvalidRequest = -32600;
    ErrorCodes.MethodNotFound = -32601;
    ErrorCodes.InvalidParams = -32602;
    ErrorCodes.InternalError = -32603;
    ErrorCodes.serverErrorStart = -32099;
    ErrorCodes.serverErrorEnd = -32000;
    ErrorCodes.ServerNotInitialized = -32002;
    ErrorCodes.UnknownErrorCode = -32001;
    // Defined by the protocol.
    ErrorCodes.RequestCancelled = -32800;
    // Defined by VSCode library.
    ErrorCodes.MessageWriteError = 1;
    ErrorCodes.MessageReadError = 2;
})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));
/**
 * An error object return in a response in case a request
 * has failed.
 */
class ResponseError extends Error {
    constructor(code, message, data) {
        super(message);
        this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
        this.data = data;
        Object.setPrototypeOf(this, ResponseError.prototype);
    }
    toJson() {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }
}
exports.ResponseError = ResponseError;
/**
 * An abstract implementation of a MessageType.
 */
class AbstractMessageType {
    constructor(_method, _numberOfParams) {
        this._method = _method;
        this._numberOfParams = _numberOfParams;
    }
    get method() {
        return this._method;
    }
    get numberOfParams() {
        return this._numberOfParams;
    }
}
exports.AbstractMessageType = AbstractMessageType;
/**
 * Classes to type request response pairs
 */
class RequestType0 extends AbstractMessageType {
    constructor(method) {
        super(method, 0);
        this._ = undefined;
    }
}
exports.RequestType0 = RequestType0;
class RequestType extends AbstractMessageType {
    constructor(method) {
        super(method, 1);
        this._ = undefined;
    }
}
exports.RequestType = RequestType;
class RequestType1 extends AbstractMessageType {
    constructor(method) {
        super(method, 1);
        this._ = undefined;
    }
}
exports.RequestType1 = RequestType1;
class RequestType2 extends AbstractMessageType {
    constructor(method) {
        super(method, 2);
        this._ = undefined;
    }
}
exports.RequestType2 = RequestType2;
class RequestType3 extends AbstractMessageType {
    constructor(method) {
        super(method, 3);
        this._ = undefined;
    }
}
exports.RequestType3 = RequestType3;
class RequestType4 extends AbstractMessageType {
    constructor(method) {
        super(method, 4);
        this._ = undefined;
    }
}
exports.RequestType4 = RequestType4;
class RequestType5 extends AbstractMessageType {
    constructor(method) {
        super(method, 5);
        this._ = undefined;
    }
}
exports.RequestType5 = RequestType5;
class RequestType6 extends AbstractMessageType {
    constructor(method) {
        super(method, 6);
        this._ = undefined;
    }
}
exports.RequestType6 = RequestType6;
class RequestType7 extends AbstractMessageType {
    constructor(method) {
        super(method, 7);
        this._ = undefined;
    }
}
exports.RequestType7 = RequestType7;
class RequestType8 extends AbstractMessageType {
    constructor(method) {
        super(method, 8);
        this._ = undefined;
    }
}
exports.RequestType8 = RequestType8;
class RequestType9 extends AbstractMessageType {
    constructor(method) {
        super(method, 9);
        this._ = undefined;
    }
}
exports.RequestType9 = RequestType9;
class NotificationType extends AbstractMessageType {
    constructor(method) {
        super(method, 1);
        this._ = undefined;
    }
}
exports.NotificationType = NotificationType;
class NotificationType0 extends AbstractMessageType {
    constructor(method) {
        super(method, 0);
        this._ = undefined;
    }
}
exports.NotificationType0 = NotificationType0;
class NotificationType1 extends AbstractMessageType {
    constructor(method) {
        super(method, 1);
        this._ = undefined;
    }
}
exports.NotificationType1 = NotificationType1;
class NotificationType2 extends AbstractMessageType {
    constructor(method) {
        super(method, 2);
        this._ = undefined;
    }
}
exports.NotificationType2 = NotificationType2;
class NotificationType3 extends AbstractMessageType {
    constructor(method) {
        super(method, 3);
        this._ = undefined;
    }
}
exports.NotificationType3 = NotificationType3;
class NotificationType4 extends AbstractMessageType {
    constructor(method) {
        super(method, 4);
        this._ = undefined;
    }
}
exports.NotificationType4 = NotificationType4;
class NotificationType5 extends AbstractMessageType {
    constructor(method) {
        super(method, 5);
        this._ = undefined;
    }
}
exports.NotificationType5 = NotificationType5;
class NotificationType6 extends AbstractMessageType {
    constructor(method) {
        super(method, 6);
        this._ = undefined;
    }
}
exports.NotificationType6 = NotificationType6;
class NotificationType7 extends AbstractMessageType {
    constructor(method) {
        super(method, 7);
        this._ = undefined;
    }
}
exports.NotificationType7 = NotificationType7;
class NotificationType8 extends AbstractMessageType {
    constructor(method) {
        super(method, 8);
        this._ = undefined;
    }
}
exports.NotificationType8 = NotificationType8;
class NotificationType9 extends AbstractMessageType {
    constructor(method) {
        super(method, 9);
        this._ = undefined;
    }
}
exports.NotificationType9 = NotificationType9;
/**
 * Tests if the given message is a request message
 */
function isRequestMessage(message) {
    let candidate = message;
    return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
}
exports.isRequestMessage = isRequestMessage;
/**
 * Tests if the given message is a notification message
 */
function isNotificationMessage(message) {
    let candidate = message;
    return candidate && is.string(candidate.method) && message.id === void 0;
}
exports.isNotificationMessage = isNotificationMessage;
/**
 * Tests if the given message is a response message
 */
function isResponseMessage(message) {
    let candidate = message;
    return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
}
exports.isResponseMessage = isResponseMessage;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/pipeSupport.js":
/*!********************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/pipeSupport.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __webpack_require__(/*! path */ "path");
const os_1 = __webpack_require__(/*! os */ "os");
const crypto_1 = __webpack_require__(/*! crypto */ "crypto");
const net_1 = __webpack_require__(/*! net */ "net");
const messageReader_1 = __webpack_require__(/*! ./messageReader */ "./node_modules/vscode-jsonrpc/lib/messageReader.js");
const messageWriter_1 = __webpack_require__(/*! ./messageWriter */ "./node_modules/vscode-jsonrpc/lib/messageWriter.js");
function generateRandomPipeName() {
    const randomSuffix = crypto_1.randomBytes(21).toString('hex');
    if (process.platform === 'win32') {
        return `\\\\.\\pipe\\vscode-jsonrpc-${randomSuffix}-sock`;
    }
    else {
        // Mac/Unix: use socket file
        return path_1.join(os_1.tmpdir(), `vscode-${randomSuffix}.sock`);
    }
}
exports.generateRandomPipeName = generateRandomPipeName;
function createClientPipeTransport(pipeName, encoding = 'utf-8') {
    let connectResolve;
    let connected = new Promise((resolve, _reject) => {
        connectResolve = resolve;
    });
    return new Promise((resolve, reject) => {
        let server = net_1.createServer((socket) => {
            server.close();
            connectResolve([
                new messageReader_1.SocketMessageReader(socket, encoding),
                new messageWriter_1.SocketMessageWriter(socket, encoding)
            ]);
        });
        server.on('error', reject);
        server.listen(pipeName, () => {
            server.removeListener('error', reject);
            resolve({
                onConnected: () => { return connected; }
            });
        });
    });
}
exports.createClientPipeTransport = createClientPipeTransport;
function createServerPipeTransport(pipeName, encoding = 'utf-8') {
    const socket = net_1.createConnection(pipeName);
    return [
        new messageReader_1.SocketMessageReader(socket, encoding),
        new messageWriter_1.SocketMessageWriter(socket, encoding)
    ];
}
exports.createServerPipeTransport = createServerPipeTransport;


/***/ }),

/***/ "./node_modules/vscode-jsonrpc/lib/socketSupport.js":
/*!**********************************************************!*\
  !*** ./node_modules/vscode-jsonrpc/lib/socketSupport.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __webpack_require__(/*! net */ "net");
const messageReader_1 = __webpack_require__(/*! ./messageReader */ "./node_modules/vscode-jsonrpc/lib/messageReader.js");
const messageWriter_1 = __webpack_require__(/*! ./messageWriter */ "./node_modules/vscode-jsonrpc/lib/messageWriter.js");
function createClientSocketTransport(port, encoding = 'utf-8') {
    let connectResolve;
    let connected = new Promise((resolve, _reject) => {
        connectResolve = resolve;
    });
    return new Promise((resolve, reject) => {
        let server = net_1.createServer((socket) => {
            server.close();
            connectResolve([
                new messageReader_1.SocketMessageReader(socket, encoding),
                new messageWriter_1.SocketMessageWriter(socket, encoding)
            ]);
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => {
            server.removeListener('error', reject);
            resolve({
                onConnected: () => { return connected; }
            });
        });
    });
}
exports.createClientSocketTransport = createClientSocketTransport;
function createServerSocketTransport(port, encoding = 'utf-8') {
    const socket = net_1.createConnection(port, '127.0.0.1');
    return [
        new messageReader_1.SocketMessageReader(socket, encoding),
        new messageWriter_1.SocketMessageWriter(socket, encoding)
    ];
}
exports.createServerSocketTransport = createServerSocketTransport;


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {
Object.defineProperty(exports, "__esModule", { value: true });
const atom_languageclient_1 = __webpack_require__(/*! atom-languageclient */ "./node_modules/atom-languageclient/build/lib/main.js");
const path_1 = __webpack_require__(/*! path */ "path");
const fs_1 = __webpack_require__(/*! fs */ "fs");
class KosLanguageClient extends atom_languageclient_1.AutoLanguageClient {
    getGrammarScopes() { return ['source.kos']; }
    getLanguageName() { return 'Kerbal Operating System'; }
    getServerName() { return 'kos-language-server'; }
    getConnectionType() { return 'ipc'; }
    startServerProcess() {
        console.log("start server process");
        return super.spawnChildNode([atom.config.get('language-kos.kosServer.path'), '--node-ipc'], { stdio: [null, null, null, 'ipc'] });
    }
    shouldStartForEditor(editor) {
        console.log("should start editor");
        if (!this.validateKosServerPath())
            return false;
        return super.shouldStartForEditor(editor);
    }
    validateKosServerPath() {
        console.log("validate kos server path");
        const kosSpecifiedPath = atom.config.get('language-kos.kosServer.path');
        const isAbsolutelySpecified = path_1.isAbsolute(kosSpecifiedPath);
        const kosAbsolutePath = isAbsolutelySpecified
            ? kosSpecifiedPath
            : path_1.join(__dirname, '..', kosSpecifiedPath);
        if (fs_1.existsSync(kosAbsolutePath))
            return true;
        atom.notifications.addError('language-kos could not locate the kos-language-server', {
            dismissable: true,
            buttons: [
                { text: 'Set KOS server path', onDidClick: () => this.openPackageSettings() },
            ],
            description: `No KOS server could be found at <b>${kosAbsolutePath}</b>`,
        });
        return false;
    }
    openPackageSettings() {
        console.log("open package settings");
        atom.workspace.open('atom://config/packages/language-kos');
    }
}
exports.KosLanguageClient = KosLanguageClient;

/* WEBPACK VAR INJECTION */}.call(this, "/"))

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ })

/******/ });
//# sourceMappingURL=extension.js.map