#import "NativeZip.h"
//#import "Objective-Zip/ZipReadStream.h"
//#import "Objective-Zip/ZipFile.h"
#import "minizip/unzip.h"

@implementation NativeZip
@synthesize callbackID;

-(void)loadAsString:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options  
{
    self.callbackID = [arguments objectAtIndex:0];
    NSString *zipPath = [arguments objectAtIndex:1];
    NSString *entryPath = [arguments objectAtIndex:2]; 
    
    const char* path = [ zipPath cStringUsingEncoding:NSUTF8StringEncoding ];
    unzFile unzipFile = unzOpen(path);
    NSString* jsString = nil;
    BOOL error = TRUE;
    if (!unzipFile) {
		jsString = [[NSString alloc] initWithString: @"cannot open file"];
    } else {
        path = [ entryPath cStringUsingEncoding:NSUTF8StringEncoding ];
        int r = unzLocateFile(unzipFile, path, 1);
        if (r != UNZ_OK) {
		    jsString = [[NSString alloc] initWithString: @"cannot find entry"];
        } else {
            unz_file_info info;
            r = unzGetCurrentFileInfo(unzipFile, &info, 0, 0, 0, 0, 0, 0);
            if (r != UNZ_OK) {
		        jsString = [[NSString alloc] initWithString: @"cannot determine size"];
            } else {
                r = unzOpenCurrentFile(unzipFile);
                if (r != UNZ_OK) {
		            jsString = [[NSString alloc] initWithString: @"cannot open entry"];
                } else {
                    char* contents = malloc(info.uncompressed_size);
                    r = unzReadCurrentFile(unzipFile, contents, info.uncompressed_size);
                    if (r != info.uncompressed_size) {
                        jsString = [[NSString alloc] initWithString: @"cannot uncompress file"];
                    } else {
                        jsString = [[NSString alloc] initWithUTF8String: contents];
                    }
                    unzCloseCurrentFile(unzipFile);
                    free(contents);
                    error = FALSE;
                }
            }
        }
        unzClose(unzipFile);
    }
    PluginResult* pluginResult = [PluginResult
                                  resultWithStatus:PGCommandStatus_OK
                                  messageAsString: jsString
                                  ];
    if (!error) {
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
    } else {
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
    }
}

@end
