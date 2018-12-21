import os

def walkExtFiles(directory, ext):
    for root, dir, files in os.walk(directory):
        for file in files:
            if file.endswith(ext):
                yield os.path.join(root, file)


def main():
    pass

if __name__ == '__main__':
    main()

