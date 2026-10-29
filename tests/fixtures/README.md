# Recognition smoke-test fixtures

- `real-cats.png`: COCO example image served in Hugging Face's official documentation images dataset: https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/coco_sample.png . Original image: COCO val2017 000000039769 (two cats on a sofa).
- `cartoon-rabbit.png`, `cartoon-dog.png`, `cartoon-fox.png`, `cartoon-car.png`, `cartoon-giraffe.png`: unmodified OpenMoji color emoji PNGs, by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/ . The license text is included in `OPENMOJI-LICENSE.txt`. Source: https://github.com/hfg-gmuend/openmoji/tree/master/color/618x618 (1F407, 1F415, 1F98A, 1F697, 1F992).

These fixtures check actual inference rather than mocked model predictions. A few passing examples do not establish an overall accuracy rate or recognition of specific copyrighted character names.
